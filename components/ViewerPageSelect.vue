<template>
	<div class="viewer-page-select">
		<button
			class="viewer-page-select_button"
			v-click-outside="closeDropdown"
			@click="toggleDropdown"
		>
			<span class="viewer-sr-only">Aktuelle Seite</span>
			{{$parent.$parent.canvases[$parent.$parent.params.pages[0] ? $parent.$parent.params.pages[0] - 1 : 0].label}}
			{{$parent.$parent.params.pages.length > 1 ? '+' : ''}}
		</button>

		<div
			class="viewer-page-select_dropdown"
			key="dropdown"
			v-show="isOpen"
			@click.stop
		>
			<div class="viewer-page-select_filter">
				<label class="viewer-sr-only">Seitenfilter</label>
				<input
					type="text"
					class="viewer-page-select_input"
					ref="search"
					v-model="filter"
					@keyup.enter="(filteredCanvases[highlightIndex]) && setPage(filteredCanvases[highlightIndex].page)"
					@keydown.esc.prevent="filter ? filter = '' : closeDropdown()"
					@keydown.up.prevent="(highlightIndex > 0) && (highlightIndex -= 1)"
					@keydown.down.prevent="(highlightIndex < filteredCanvases.length - 1) && (highlightIndex += 1)"
				>
			</div>
			<ol class="viewer-page-select_list" ref="list">
				<li
					v-for="(canvas, index) in filteredCanvases"
					:class="{
						'-current': $parent.$parent.params.pages.indexOf(canvas.page) > -1,
						'-highlighted': highlightIndex === index,
					}"
					:key="canvas.page"
					@click="setPage(canvas.page)"
				>
					{{canvas.label}}
				</li>
			</ol>
		</div>
	</div>
</template>

<script>
import keyboard from '../mixins/keyboard'

export default {
	mixins: [
		keyboard,
	],
	data () {
		return {
			filter: '',
			filteredCanvases: [],
			highlightIndex: 0,
			isOpen: false,
		}
	},
	watch: {
		filter () {
			this.updateFilteredCanvases()
		},
		highlightIndex () {
			this.$nextTick(() => this.updateScroll())
		},
		isOpen () {
			if (this.isOpen) return

			this.filter = ''
			this.highlightIndex = this.$parent.$parent.params.pages[0] - 1
		},
	},
	methods: {
		setPage (page) {
			this.closeDropdown()
			this.$parent.$parent.setPage(page)
		},
		toggleDropdown () {
			this.isOpen = !this.isOpen
			if (this.isOpen) {
				this.$nextTick(() => {
					this.$refs.search.focus()
					this.updateScroll()
				})
			}
		},
		closeDropdown () {
			this.isOpen = false
		},
		handleKeyDown (event) {
			if (this.preventKeyboardEvent(event)) return

			if (event.key === 'Escape') {
				this.closeDropdown()
				return
			}

			if (event.key === 'x') {
				this.toggleDropdown()
				event.preventDefault()
			}
		},
		updateFilteredCanvases () {
			const filteredCanvases = []
			const filter = this.filter.toLowerCase()
			let highlightIndex = -1
			this.$parent.$parent.canvases.forEach((canvas, index) => {
				const label = canvas.label
				const labelMatchesFilter = label ? label.toLowerCase().indexOf(filter) > -1 : false
				const pageMatchesFilter = (index + 1).toFixed().indexOf(filter) > -1
				if (labelMatchesFilter || pageMatchesFilter) {
					const item = JSON.parse(JSON.stringify(canvas))
					item.page = index + 1
					if (item.page === this.$parent.$parent.params.pages[0]) highlightIndex = filteredCanvases.length
					filteredCanvases.push(item)
				}
			})
			this.highlightIndex = (highlightIndex < 0 ? 0 : highlightIndex)
			this.filteredCanvases = filteredCanvases
		},
		updateScroll () {
			const { list } = this.$refs
			if (list.children[this.highlightIndex]) {
				const { offsetTop } = list.children[this.highlightIndex]
				list.scrollTop = offsetTop - ((list.offsetHeight / 2) - list.children[0].offsetHeight)
			}
		},
	},
	mounted () {
		this.updateFilteredCanvases()
		window.addEventListener('keydown', this.handleKeyDown)
	},
	beforeDestroy () {
		window.removeEventListener('keydown', this.handleKeyDown)
	},
}
</script>
