export default {
	computed: {
		customPageViewActive () {
			const { pages } = this.$parent.params

			if (pages.length > 2) {
				return true
			}

			if (this.$parent.startingVerso) {
				return pages.length === 2 && (pages[0] % 2 !== 1 || pages[1] !== pages[0] + 1) && pages[1] > 0
			} else {
				return pages.length === 2 && (pages[0] % 2 !== 0 || pages[1] !== pages[0] + 1) && pages[1] > 0
			}
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
			if (pages.length > 1 && page < this.$parent.pageCount) {
				page += 1
			}
			this.$parent.setPage(page)
		},
		goToPreviousPage () {
			const { pages } = this.$parent.params
			let page = pages[0] - 1
			if (pages.length > 1 && page > 0) {
				page -= 1
			}
			this.$parent.setPage(page)
		},
	},
}
