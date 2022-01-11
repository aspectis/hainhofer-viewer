export default {
	computed: {
		customPageViewActive () {
			const { pages } = this.$parent.params

			if (pages.length > 2) {
				return true
			}

			return pages.length === 2 && pages[0] > 0 && pages[1] > 0 && pages[0] + 1 !== pages[1]
		},
		isFirstPage () {
			return this.$parent.params.pages[0] < 2
		},
		isLastPage () {
			const { pages } = this.$parent.params
			const count = this.$parent.pageCount
			return pages[0] >= count || pages[pages.length - 1] >= count
		},
	},
	methods: {
		goToFirstPage () {
			this.$parent.setPage(1)
		},
		goToLastPage () {
			this.$parent.setPage(this.$parent.pageCount)
		},
		goToNextPage () {
			const { pages } = this.$parent.params
			let page = pages[0] + 1
			if (pages.length === 2 && page < this.$parent.pageCount && pages[1] > 0) {
				page += 1
			}
			this.$parent.setPage(page)
		},
		goToPreviousPage () {
			const { pages } = this.$parent.params
			let page = pages[0] - 1
			const canvases = this.$parent.canvases
			if (pages.length === 2 && page > 0 &&
				(!canvases[page - 2] || canvases[page - 2].id.substr(-1) === 'v') &&
				canvases[page - 1].id.substr(-1) === 'r'
			) {
				page -= 1
			}
			this.$parent.setPage(page)
		},
	},
}
