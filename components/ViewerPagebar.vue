<template>
	<label
		class="viewer-pagebar"
		@mousemove="onMousemove"
		@touchmove="onMousemove"
		@touchstart="$el.classList.add('-active')"
		@touchend="$el.classList.remove('-active')"
	>
		<span id="pagebar" class="viewer-pagebar_fill" :style="`width: ${params.pages[0] / pageCount  * 100}%`"/>

		<input
			type="range"
			class="viewer-pagebar_slider"
			:min="1"
			:max="pageCount"
			:value="params.pages[0]"
			:data-thumb-width="`${100 / pageCount}%`"
			@change="page = parseInt($event.target.value, 10); setPage(page); setTooltipX(page / pageCount * $el.offsetWidth)"
		>

		<span class="viewer-pagebar_tooltip" :style="`left: ${tooltipX}px`" ref="tooltip">
			<span class="sr-only">Seite</span>
			{{canvases[page - 1].label}}
		</span>
		<span class="viewer-pagebar_triangle" :style="`left: ${triangleX}px`"/>
	</label>
</template>

<script>
export default {
	props: [
		'canvases',
		'pageCount',
		'params',
		'setPage',
	],
	data () {
		return {
			page: 1,
			triangleX: 0,
			tooltipX: 0,
		}
	},
	mounted () {
		document.documentElement.style.setProperty('--thumb-width', `${100 / this.pageCount}%`)
	},
	methods: {
		calcPage (x) {
			return Math.ceil(x / this.$el.offsetWidth * this.pageCount)
		},
		onMousemove (event) {
			let x = event.offsetX
			if (event.touches) {
				x = event.touches[0].pageX - event.touches[0].target.offsetLeft
			}

			this.page = this.calcPage(x)

			this.setTooltipX(x)
		},
		setTooltipX (x) {
			const triangleLeft = Math.max(12, x)
			this.triangleX = Math.round(Math.min(triangleLeft, this.$el.offsetWidth - 12))

			const tooltipWidth = this.$refs.tooltip.offsetWidth
			const tooltipLeft = Math.max(tooltipWidth / 2 + 3, x)
			this.tooltipX = Math.round(Math.min(tooltipLeft, this.$el.offsetWidth - tooltipWidth / 2 - 4))
		},
	},
}
</script>
