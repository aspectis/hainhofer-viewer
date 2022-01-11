<template>
	<header class="viewer-header">
		<div class="viewer-header_column -title">
			<h1 class="viewer-header_title">
				{{this.$parent.manifest.title}}
				<small v-if="this.$parent.manifest.label">({{this.$parent.manifest.label}})</small>
			</h1>
		</div>

		<div class="viewer-header_column -pagination">
			<div class="viewer-header_button-group">
				<PageSelect class="viewer-header_button"/>

				<button
					class="viewer-header_button"
					:class="{
						'-active': $parent.params.pages.length > 1,
						'-warning': customPageViewActive,
					}"
					:aria-label="doublePageLabel"
					:title="doublePageLabel"
					@click="toggleDoublePage"
				>
					<IconCustomPages v-if="customPageViewActive"/>
					<IconDoublePage v-else/>
				</button>
			</div>

			<div class="viewer-header_button-group -pagination">
				<button
					class="viewer-header_button"
					:disabled="customPageViewActive || isFirstPage"
					@click="goToFirstPage"
				>
					<IconFirstPage title="Erste Seite"/>
				</button>

				<button
					class="viewer-header_button"
					:disabled="customPageViewActive || isFirstPage"
					@click="goToPreviousPage"
				>
					<IconNavigateBefore title="Vorige Seite"/>
				</button>

				<button
					class="viewer-header_button"
					:disabled="customPageViewActive || isLastPage"
					@click="goToNextPage"
				>
					<IconNavigateNext title="Nächste Seite"/>
				</button>

				<button
					class="viewer-header_button"
					:disabled="customPageViewActive || isLastPage"
					@click="goToLastPage"
				>
					<IconLastPage title="Letzte Seite"/>
				</button>
			</div>
		</div>

		<div class="viewer-header_column -views">
			<div class="viewer-header_button-group -toggle" ref="switchViewSmall">
				<button
					class="viewer-header_button"
					v-click-outside="closeControlsPopup"
					@click="toggleControlsPopup"
				>
					<IconVisibility title="Ansicht"/>
				</button>
			</div>

			<div
				class="viewer-header_button-group -view"
				:class="{ '-visible': controlsVisible }"
			>
				<button
					class="viewer-header_button"
					:class="{ '-active': !$parent.params.fullWidth }"
					:disabled="!$parent.params.view"
					@click="$parent.updateParams({ fullWidth: !$parent.params.fullWidth })"
				>
					<IconImage title/>
					Scan
				</button>
			</div>

			<div
				class="viewer-header_button-group -view"
				:class="{ '-visible': controlsVisible }"
			>
				<button
					class="viewer-header_button"
					:class="{ '-active': $parent.params.view === 'info' }"
					@click="toggleView('info')"
				>
					<IconInfoOutline title/>
					Info
				</button>

				<button
					class="viewer-header_button -scan"
					:class="{ '-active': $parent.params.view === 'scan' }"
					@click="toggleView('scan')"
				>
					<IconImage title/>
					Scan
				</button>

				<button
					class="viewer-header_button"
					:class="{ '-active': $parent.params.view === 'fulltext' }"
					@click="toggleView('fulltext')"
				>
					<IconTranscription title/>
					Transkription
				</button>

				<button
					class="viewer-header_button"
					:class="{ '-active': $parent.params.view === 'thumbnails' }"
					@click="toggleView('thumbnails')"
				>
					<IconViewModule title/>
					Seiten
				</button>

				<button
					class="viewer-header_button"
					:class="{ '-active': $parent.params.view === 'download' }"
					@click="toggleView('download')"
				>
					<IconDownload title/>
					Download
				</button>

				<button
					class="viewer-header_button"
					:class="{ '-active': $parent.params.view === 'search' }"
					@click="toggleView('search')"
				>
					<IconSearch title/>
					Suche
				</button>

				<button
					class="viewer-header_button -help"
					:class="{ '-active': $parent.params.view === 'help' }"
					@click="toggleView('help')"
				>
					<IconHelp title="Hilfe"/>
					<span class="viewer-header_label"> Hilfe</span>
				</button>
			</div>
		</div>

		<!-- Buttons hovering at bottom left and right -->
		<button
			v-if="!customPageViewActive && !isFirstPage"
			class="viewer-header_page-button -previous"
			@click="goToPreviousPage"
		>
			<IconNavigateBefore title="Vorige Seite"/>
		</button>
		<button
			v-if="!customPageViewActive && !isLastPage"
			class="viewer-header_page-button -next"
			@click="goToNextPage"
		>
			<IconNavigateNext title="Nächste Seite"/>
		</button>
	</header>
</template>

<script>
import IconCustomPages from 'vue-material-design-icons/ViewGridPlus'
import IconDoublePage from 'vue-material-design-icons/BookOpenBlankVariant'
import IconDownload from 'vue-material-design-icons/Download'
import IconFirstPage from 'vue-material-design-icons/PageFirst'
import IconImage from 'vue-material-design-icons/Image'
import IconHelp from 'vue-material-design-icons/HelpCircleOutline'
import IconInfoOutline from 'vue-material-design-icons/InformationOutline'
import IconLastPage from 'vue-material-design-icons/PageLast'
import IconNavigateBefore from 'vue-material-design-icons/ChevronLeft'
import IconNavigateNext from 'vue-material-design-icons/ChevronRight'
import IconSearch from 'vue-material-design-icons/Magnify'
import IconTranscription from 'vue-material-design-icons/TextLong'
import IconViewModule from 'vue-material-design-icons/ViewModule'
import IconVisibility from 'vue-material-design-icons/EyeOutline'

import PageSelect from './ViewerPageSelect'

import keyboard from '../mixins/keyboard'
import pagination from '../mixins/pagination'

export default {
	components: {
		IconCustomPages,
		IconDoublePage,
		IconDownload,
		IconFirstPage,
		IconHelp,
		IconImage,
		IconInfoOutline,
		IconLastPage,
		IconNavigateBefore,
		IconNavigateNext,
		IconSearch,
		IconTranscription,
		IconViewModule,
		IconVisibility,
		PageSelect,
	},
	mixins: [
		keyboard,
		pagination,
	],
	data () {
		return {
			controlsVisible: true,
		}
	},
	computed: {
		doublePageLabel () {
			return 'Buchansicht umschalten' + (this.customPageViewActive ? ' (benutzerdefinierte Seitenauswahl aktiv)' : '')
		},
	},
	methods: {
		closeControlsPopup () {
			this.controlsVisible = false
		},
		handleKeyDown (event) {
			if (this.preventKeyboardEvent(event)) return

			if (event.key === 'Escape') {
				this.controlsVisible = false
				return
			}

			switch (event.key) {
			case 'Backspace':
				// switchViewSmall is visible, i.e. screen is small
				if (this.$refs.switchViewSmall.offsetParent) this.toggleView('scan')
				break
			case '1':
				this.toggleView('info')
				break
			case '2':
				this.toggleView('fulltext')
				break
			case '3':
				this.toggleView('thumbnails')
				break
			case '4':
				this.toggleView('download')
				break
			case '5':
				this.toggleView('search')
				break
			case '6':
				this.toggleView('help')
				break
			case 'b':
				this.toggleDoublePage()
				break
			default:
			}

			if (this.customPageViewActive) return

			const { pages } = this.$parent.params

			switch (event.key) {
			case 'q':
			case ',':
				if (pages[0] > 1) this.goToPreviousPage()
				break
			case 'e':
			case '.':
				if (!this.isLastPage) this.goToNextPage()
				break
			case 'Q':
				if (pages[0] > 1) this.goToFirstPage()
				break
			case 'E':
				if (!this.isLastPage) this.goToLastPage()
				break
			default:
			}
		},
		toggleControlsPopup () {
			this.controlsVisible = !this.controlsVisible
		},
		toggleDoublePage () {
			const { pages } = this.$parent.params
			let newPages

			// If first page ends with "v", offset is 1
			// If page ends with "v" and previous page does not end with "r", add dummy page on the right
			// If page ends with "r" and previous page does not end with "v", add dummy page on the left
			// $parent.$parent.canvases

			if (pages.length > 1) {
				// There are already multiple pages shown; switch back to single page
				newPages = [pages[0] < 1 ? 1 : pages[0]]
			} else {
				const canvases = this.$parent.canvases

				let page = pages[0]
				let page2

				if (page > 1 && canvases[page - 1].id.substr(-1) !== 'v') {
					page--
				}

				if (page === 1 && canvases[page - 1].id.substr(-1) === 'r') {
					page = 0
					page2 = 1
				} else {
					page2 = (page < this.$parent.pageCount ? page + 1 : 0)
					if (page2 && canvases[page2 - 1].id.substr(-1) !== 'r') {
						page2 = 0
					}
				}

				newPages = [page, page2]
			}

			this.$parent.updateParams({ pages: newPages })
			return newPages
		},
		toggleView (name) {
			const view = (name === this.$parent.params.view && !this.$parent.isMobile() ? '' : name)
			this.$parent.updateParams({ view })

			if (!view) {
				this.$parent.updateParams({ fullWidth: false })
			}
		},
	},
	mounted () {
		window.addEventListener('keydown', this.handleKeyDown)
	},
	beforeDestroy () {
		window.removeEventListener('keydown', this.handleKeyDown)
	},
}
</script>
