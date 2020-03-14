<template>
	<section class="viewer-fulltext">
		<h2 class="viewer-sr-only">Transkription</h2>

		<div class="viewer-fulltext_controls">
			<p class="viewer-fulltext_control">
				<input type="checkbox" id="breaks-control" v-model="breaksKept">
				<label for="breaks-control">Umbrüche wie im Original</label>
			</p>
		</div>

		<div class="viewer-fulltext_texts" :class="{ '-fluid': !breaksKept }">
			<div v-for="page in pages" :key="page.label">
				<div class="viewer-fulltext_header">
					<div class="viewer-fulltext_page">
						{{ page.label }}
						<span v-html="$parent.handleHtml(page.addition)"/>
					</div>

					<div class="viewer-fulltext_permalink">
						Zitierlink:
						<span @click="selectText($event.target)">{{ page.permalink }}</span>
						<button v-if="clipboardApiAvailable" type="button" @click="addToClipboard(page.permalink, $event)">
							<IconClipboard title="URL in die Zwischenablage kopieren"/>
							<span class="viewer-fulltext_notice">URL in die Zwischenablage kopiert</span>
						</button>
					</div>
				</div>
				<div
					v-if="page.html"
					v-html="$parent.handleHtml(page.html)"
					class="viewer-fulltext_text html"
				/>
				<div v-else class="viewer-fulltext_none">Leere Seite</div>

				<div
					v-if="page.notes"
					v-html="$parent.handleHtml(page.notes)"
					class="viewer-fulltext_notes html"
					ref="notes"
				/>
			</div>
		</div>
	</section>
</template>

<script>
import IconClipboard from 'vue-material-design-icons/ClipboardArrowDownOutline'

export default {
	components: {
		IconClipboard,
	},
	data () {
		return {
			breaksKept: true,
		}
	},
	computed: {
		clipboardApiAvailable () {
			return !!navigator.clipboard
		},
		pages () {
			const pages = []
			for (const canvas of this.$parent.visibleCanvases) {
				// Poor man's clone
				const pageObj = JSON.parse(JSON.stringify(canvas))
				if (!this.breaksKept) {
					pageObj.html = pageObj.html.replace(/\s*<br(\s*\/)?>\s*/g, '<span class="br"> </span>')
				}
				pages.push(pageObj)
			}
			return pages
		},
	},
	watch: {
		pages (newPages, oldPages) {
			if (JSON.stringify(newPages) === JSON.stringify(oldPages)) {
				return
			}

			this.$el.scrollTo(0, 0)
		},
	},
	mounted () {
		// Fix links in pre-rendered HTML
		this.$el.addEventListener('click', (event) => {
			// Close open overlays and tooltips if not clicked inside
			if (!event.target.closest('.overlay, .help')) {
				const openNodes = this.$el.querySelectorAll('.help.-visible, .overlay.-visible')
				for (const node of openNodes) {
					node.classList.remove('-visible')
				}
			}

			// Tooltips
			const trigger = event.target.closest('.tooltip')
			if (trigger) {
				const tooltip = trigger.querySelector('.help')
				tooltip.classList.toggle('-visible')
				return
			}

			// Not a link
			const link = event.target.closest('a')
			if (!link) return

			// Footnotes and external links
			const href = link.getAttribute('href')
			if (href.substr(0, 5) === '#note' || href.match(/^\w+:\/\//)) return

			// Close buttons in overlays and tooltips
			if (href === '#close') {
				const tooltip = link.closest('.overlay, .help')
				tooltip.classList.remove('-visible')

				event.preventDefault()
				return
			}

			// Overlays
			if (link.classList.contains('button') && href.substr(0, 1) === '#') {
				const tooltip = document.getElementById(href.substr(1))
				tooltip.classList.toggle('-visible')

				if (tooltip.offsetParent) {
					const bottom = tooltip.offsetTop + tooltip.offsetHeight
					if (bottom > tooltip.offsetParent.offsetHeight - 100) {
						tooltip.classList.add('-top')
						tooltip.style.maxHeight = `${tooltip.offsetTop - 48}px`
					}
				}

				event.preventDefault()
				return
			}

			this.$router.push(href)
			event.preventDefault()
		})
	},
	methods: {
		addToClipboard (text, event) {
			if (!navigator.clipboard.writeText) {
				return
			}

			const notice = event.target.closest('button').querySelector('.viewer-fulltext_notice')

			notice.classList.remove('-visible')
			navigator.clipboard.writeText(text).then(() => {
				setTimeout(() => notice.classList.add('-visible'), 10)
			})
		},
		selectText (node) {
			if (window.getSelection) {
				const selection = window.getSelection()
				const range = document.createRange()
				range.selectNodeContents(node)
				selection.removeAllRanges()
				selection.addRange(range)
			}
		},
	},
}
</script>
