<template>
	<section class="viewer-scan">
		<h2 class="viewer-sr-only">Scan</h2>

		<div class="viewer-scan_buttons" v-if="viewer">
			<button
				class="viewer-scan_button"
				:disabled="isMaxZoom"
				@click="zoomIn"
			>
				<IconZoomIn title="Vergrößern"/>
			</button>
			<button
				class="viewer-scan_button"
				:disabled="isReset"
				@click="resetView($event)"
			>
				<IconAspectRatio title="Zurücksetzen"/>
			</button>
			<button
				class="viewer-scan_button"
				:disabled="isMinZoom"
				@click="zoomOut"
			>
				<IconZoomOut title="Verkleinern"/>
			</button>

			<button
				class="viewer-scan_button"
				:class="{ '-active': $parent.params.rotation }"
				@click="rotateRight($event)"
			>
				<IconRotateRight title="Im Uhrzeigersinn drehen"/>
			</button>

			<div
				v-click-outside="closeFilters"
				v-if="cssFiltersSupported"
				class="viewer-scan_filters"
				:class="{ '-open': filtersVisible }"
			>
				<button
					class="viewer-scan_button"
					:class="{ '-active': filtersActive }"
					@click="filtersVisible = !filtersVisible"
				>
					<IconTune title="Bildfilter"/>
				</button>
				<div class="viewer-scan_filter-popup" v-show="filtersVisible">
					<p>
						<label for="viewer-scan_brightness">
							<IconBrightness class="-light"/>
							Helligkeit:
							{{ Math.round(($parent.params.filters.brightness || 1) * 100) }}&nbsp;%
						</label>
						<input
							class="viewer-scan_range"
							id="viewer-scan_brightness"
							max="2"
							min=".5"
							ref="firstSlider"
							step=".01"
							type="range"
							:value="$parent.params.filters.brightness || 1"
							@input="setFilter('brightness', $event)"
						>
					</p>
					<p>
						<label for="viewer-scan_contrast">
							<IconContrast class="-light"/>
							Kontrast:
							{{ Math.round(($parent.params.filters.contrast || 1) * 100) }}&nbsp;%
						</label>
						<input
							class="viewer-scan_range"
							id="viewer-scan_contrast"
							max="2"
							min=".5"
							step=".01"
							type="range"
							:value="$parent.params.filters.contrast || 1"
							@input="setFilter('contrast', $event)"
						>
					</p>
					<p>
						<label for="viewer-scan_saturation">
							<IconPalette class="-light"/>
							Sättigung:
							{{ Math.round(saturation * 100) }}&nbsp;%
						</label>
						<input
							class="viewer-scan_range"
							id="viewer-scan_saturation"
							max="3"
							min="0"
							step=".01"
							type="range"
							:value="saturation"
							@input="setFilter('saturate', $event)"
						>
					</p>
					<p>
						<button
							class="viewer-scan_reset"
							:disabled="!filtersActive"
							@click="resetFilters"
						>
							<IconBackupRestore/>
							Zurücksetzen
						</button>
					</p>
				</div>
			</div>
		</div>

		<div class="viewer-scan_image" id="viewer-scan_image" ref="image"/>
	</section>
</template>

<script>
import IconAspectRatio from 'vue-material-design-icons/AspectRatio'
import IconBackupRestore from 'vue-material-design-icons/BackupRestore'
import IconBrightness from 'vue-material-design-icons/WhiteBalanceSunny'
import IconContrast from 'vue-material-design-icons/Brightness6'
import IconPalette from 'vue-material-design-icons/Palette'
import IconRotateRight from 'vue-material-design-icons/RotateRight'
import IconTune from 'vue-material-design-icons/Tune'
import IconZoomIn from 'vue-material-design-icons/MagnifyPlusOutline'
import IconZoomOut from 'vue-material-design-icons/MagnifyMinusOutline'

import keyboard from '../mixins/keyboard'
import pagination from '../mixins/pagination'

// Custom-build OpenSeadragon. Order is important!
require('../openseadragon/src/openseadragon')

require('../openseadragon/src/controldock')
require('../openseadragon/src/eventsource')

require('../openseadragon/src/tilesource')

require('../openseadragon/src/imagetilesource')

require('../openseadragon/src/drawer')
require('../openseadragon/src/imageloader')
require('../openseadragon/src/mousetracker')
require('../openseadragon/src/placement')
require('../openseadragon/src/point')
require('../openseadragon/src/spring')
require('../openseadragon/src/tile')
require('../openseadragon/src/tilecache')
require('../openseadragon/src/tiledimage')
require('../openseadragon/src/rectangle')
require('../openseadragon/src/viewer')
require('../openseadragon/src/viewport')
require('../openseadragon/src/world')

const gapBetweenPages = 0.01
const vendorPrefixes = ['-webkit-', '-moz-', '-o-', '-ms-']

export default {
	components: {
		IconAspectRatio,
		IconBackupRestore,
		IconBrightness,
		IconContrast,
		IconPalette,
		IconRotateRight,
		IconTune,
		IconZoomIn,
		IconZoomOut,
	},
	mixins: [
		keyboard,
		pagination,
	],
	data () {
		return {
			filtersVisible: false,
			loadingTimeout: null,
			tileSources: {},
			viewer: null,
			zoomFactor: 1.5,
		}
	},
	computed: {
		cssFiltersSupported () {
			// https://raw.githubusercontent.com/Modernizr/Modernizr/master/feature-detects/css/filters.js
			const el = document.createElement('a')
			el.style.cssText = vendorPrefixes.join('filter:blur(2px);')
			// https://github.com/Modernizr/Modernizr/issues/615
			// documentMode is needed for false positives in oldIE, please see issue above
			return !!el.style.length &&
					((document.documentMode === undefined || document.documentMode > 9))
		},
		filtersActive () {
			return (Object.keys(this.$parent.params.filters).length > 0)
		},
		isMinZoom () {
			if (!this.viewer) return true
			if (this.$parent.loading) return false

			return this.viewer.viewport.getZoom() <= this.viewer.viewport.getMinZoom()
		},
		isMaxZoom () {
			if (!this.viewer) return true
			return this.viewer.viewport.getZoom() >= this.viewer.viewport.getMaxZoom()
		},
		isReset () {
			// There may be some tiny deviation from the target values
			const homeBounds = this.viewer.viewport.getHomeBounds()
			const currentBounds = this.viewer.viewport.getBounds()
			return (
				Math.abs(homeBounds.height - currentBounds.height) < 1e-9 &&
					Math.abs(homeBounds.width - currentBounds.width) < 1e-9 &&
					Math.abs(homeBounds.x - currentBounds.x) < 1e-9 &&
					Math.abs(homeBounds.y - currentBounds.y) < 1e-9
			)
		},
		saturation () {
			const saturation = this.$parent.params.filters.saturate
			return typeof saturation === 'number' ? saturation : 1
		},
	},
	watch: {
		// eslint-disable-next-line func-names
		'$parent.params.pages': function (newValue, oldValue) {
			// Preventing scan re-render on irrelevant changes, e.g. hash update
			if (JSON.stringify(newValue) === JSON.stringify(oldValue)) return

			this.loadImageInfo()
		},
	},
	methods: {
		closeFilters () {
			this.filtersVisible = false
		},
		handleKeyDown (event) {
			if (event.key === 'Escape') {
				this.filtersVisible = false
			}

			// Reset pan, zoom, rotation and filters
			const zeroKeyCodes = [
				45, // Insert (Shift+Numpad0)
				48, // 0
				96, // Numpad0
			]

			if (event.shiftKey && zeroKeyCodes.indexOf(event.keyCode) > -1) {
				this.resetView(event)
			}
		},
		handleKeyPress (event) {
			if (this.preventKeyboardEvent(event)) return

			switch (event.key) {
			case 'r':
			case 'R':
				this.rotateRight(event)
				break
			case 'f':
				this.filtersVisible = !this.filtersVisible
				if (this.filtersVisible) {
					this.$nextTick(() => {
						this.$refs.firstSlider.focus()
					})
				}
				break
			case 'F': {
				this.resetFilters()
				break
			}
			default:
				// Send to OpenSeadragon
				this.propagateKeyPress(event)
			}
		},
		initViewer () {
			const { params } = this.$parent
			const tileSources = []

			let initialWidth = 0
			let tileSourceIndex
			let totalWidth = 0
			params.pages.forEach((page, index) => {
				let opacity = 1
				if (page < 1) {
					opacity = 0
					tileSourceIndex = (index > 0 ? this.$parent.pageCount : 1)
				} else {
					tileSourceIndex = page
				}

				const tileSource = this.tileSources[tileSourceIndex]

				if (!tileSource) return

				if (!initialWidth) initialWidth = tileSource.width
				const width = tileSource.width / initialWidth

				tileSources.push({
					opacity,
					tileSource,
					width,
					x: totalWidth,
				})

				totalWidth += width + gapBetweenPages
			})

			if (this.viewer) {
				this.viewer.addOnceHandler('open', () => {
					if (this.isReset || !this.$parent.options.keepZoomOnPageChange) {
						this.resetView()
					} else {
						this.viewer.viewport.applyConstraints(true)

						// Move upper left corner into viewport if required
						const bounds = this.viewer.viewport.getBounds()
						if (bounds.x <= 0 && bounds.y <= 0) return

						const offsetX = (params.pages[0] ? 0 : 1)
						this.viewer.viewport.panTo({
							x: (bounds.x > 0 ? (bounds.width / 2) + offsetX : params.panX),
							y: (bounds.y > 0 ? (bounds.height / 2) : params.panY),
						})
					}
				})

				this.viewer.open(tileSources)
				return
			}

			this.viewer = window.OpenSeadragon({
				animationTime: 0.4,
				id: 'viewer-scan_image',
				immediateRender: this.$parent.options.immediateRender,
				preload: !this.$parent.isMobile(),
				preserveImageSizeOnResize: true,
				preserveViewport: true,
				showNavigationControl: false,
				showZoomControl: false,
				tileSources,
				visibilityRatio: 0.2,
				maxZoomLevel: 2,
			})

			this.viewer.gestureSettingsMouse.clickToZoom = false

			this.viewer.addHandler('animation-finish', () => {
				if (this.isReset) {
					this.removeScanParams()
					return
				}

				const center = this.viewer.viewport.getCenter()
				this.$parent.updateParams({
					// 3 decimals are sufficient, keeping URL short
					panX: Math.round(center.x * 1e3) / 1e3,
					panY: Math.round(center.y * 1e3) / 1e3,
					zoom: Math.round(this.viewer.viewport.getZoom() * 1e3) / 1e3,
				})
			})

			// Required for touchscreens:
			// The canvas swallows the touch event, so click-outside is not triggered
			this.viewer.addHandler('canvas-click', () => {
				document.body.click()
			})

			this.viewer.addHandler('open', () => {
				this.$parent.$emit('update:loading', 0)

				if (params.panX !== null && params.panY !== null) {
					this.viewer.viewport.panTo({
						x: params.panX,
						y: params.panY,
					}, true)
					this.viewer.viewport.zoomTo(params.zoom, null, true)
				} else {
					this.viewer.viewport.goHome()
				}

				if (params.rotation !== null) {
					this.viewer.viewport.setRotation(params.rotation)
				}
			})

			this.viewer.addHandler('tile-load-failed', (error) => {
				this.$parent.error = `Error loading image: ${error.message}`
			})
		},
		loadImageInfo () {
			this.$parent.params.pages.forEach((page) => {
				if (page < 1 || this.tileSources[page]) return

				// Image URL missing for this page
				if (!this.$parent.canvases[page - 1].image_url) return

				this.$parent.$emit('update:loading', this.$parent.loading + 1)

				// TODO: Maybe allow multiple resolutions, see https://openseadragon.github.io/examples/tilesource-custom/
				this.tileSources[page] = {
					type: 'image',
					url: this.$parent.canvases[page - 1].image_url,
					buildPyramid: false,
					width: 1, // Can be any value, but must be set for multi-page view
				}
			})

			this.initViewer()
		},
		propagateKeyPress (event) {
			if (event.target.className.indexOf('openseadragon') === 0) return

			const canvas = this.$refs.image.querySelector('.openseadragon-canvas')
			if (!canvas) return

			const canvasEvent = new event.constructor(event.type, event)

			// Chrome fix: OpenSeadragon evaluates keyCode
			Object.defineProperty(canvasEvent, 'keyCode', {
				get () {
					return event.keyCode
				},
			})

			canvas.dispatchEvent(canvasEvent)
		},
		resetFilters () {
			this.$refs.image.style.cssText = ''
			this.$parent.updateParams({ filters: {} })
		},
		removeScanParams () {
			this.$parent.updateParams({
				panX: null,
				panY: null,
				zoom: null,
			})
		},
		resetView (event) {
			if (event && event.shiftKey) {
				// Rotation has to be reset before pan and zoom
				this.viewer.viewport.setRotation(0)
				this.$parent.updateParams({ rotation: null })
				if (this.filtersActive) this.resetFilters()
			}

			this.viewer.viewport.goHome()
			this.removeScanParams()
		},
		rotateRight (event) {
			const { viewport } = this.viewer
			const degrees = (event && event.shiftKey) ? 0 : (viewport.getRotation() + 90) % 360
			viewport.setRotation(degrees)
			this.$parent.updateParams({ rotation: degrees || null })
		},
		setFilter (name, event) {
			const value = event.target.valueAsNumber
			if (value === 1) {
				this.$delete(this.$parent.params.filters, name)
			} else {
				this.$set(this.$parent.params.filters, name, value)
			}
			this.$parent.updateParams({ filters: this.$parent.params.filters })
			this.updateFilterStyle()
		},
		updateFilterStyle () {
			if (!this.filtersActive || !this.cssFiltersSupported) return

			const filters = []
			Object.keys(this.$parent.params.filters).forEach((key) => {
				filters.push(`${key}(${this.$parent.params.filters[key]})`)
			})

			const { image } = this.$refs
			const filterString = filters.join(' ')

			image.style.cssText = vendorPrefixes.join(`filter:${filterString};`)
		},
		zoomIn () {
			this.viewer.viewport.zoomBy(this.zoomFactor)
		},
		zoomOut () {
			this.viewer.viewport.zoomBy(1 / this.zoomFactor)
		},
	},
	mounted () {
		this.loadImageInfo()
		this.updateFilterStyle()

		window.addEventListener('keydown', this.handleKeyDown)
		window.addEventListener('keypress', this.handleKeyPress)
	},
	beforeDestroy () {
		window.removeEventListener('resize', this.updateBreakpoint)
		window.removeEventListener('keydown', this.handleKeyDown)
		window.removeEventListener('keypress', this.handleKeyPress)
	},
}
</script>
