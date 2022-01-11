<template>
	<div class="viewer-app" :class="{ '-full-width': params.fullWidth }">
		<ViewerHeader v-if="manifest && iiifCanvases"/>

		<ViewerPagebar v-if="manifest && iiifCanvases" v-bind="{ canvases, pageCount, params, setPage }"/>

		<div v-if="manifest && iiifCanvases" class="viewer-app_main">
			<ViewerPanelScan/>
			<ViewerPanelFulltext v-show="params.view === 'fulltext'"/>
			<ViewerPanelThumbnails v-show="params.view === 'thumbnails'"/>
			<ViewerPanelSearch v-show="params.view === 'search'"/>
			<ViewerPanelInfo v-show="params.view === 'info'"/>
			<ViewerPanelDownload v-show="params.view === 'download'"/>
			<ViewerPanelHelp v-show="params.view === 'help'"/>
		</div>

		<div v-if="error" class="viewer-app_error">
			<button @click="error = ''" aria-label="Schließen">&times;</button>
			Fehler: {{error}}
		</div>
	</div>
</template>

<script>
import './directives/click-outside'
import './polyfills/findIndex' // TODO: This is only required for IE11. Remove?

import ViewerHeader from './components/ViewerHeader'
import ViewerPagebar from './components/ViewerPagebar'
import ViewerPanelDownload from './components/ViewerPanelDownload'
import ViewerPanelFulltext from './components/ViewerPanelFulltext'
import ViewerPanelHelp from './components/ViewerPanelHelp'
import ViewerPanelInfo from './components/ViewerPanelInfo'
import ViewerPanelScan from './components/ViewerPanelScan'
import ViewerPanelSearch from './components/ViewerPanelSearch'
import ViewerPanelThumbnails from './components/ViewerPanelThumbnails'

export default {
	components: {
		ViewerHeader,
		ViewerPagebar,
		ViewerPanelDownload,
		ViewerPanelHelp,
		ViewerPanelInfo,
		ViewerPanelScan,
		ViewerPanelSearch,
		ViewerPanelThumbnails,
		ViewerPanelFulltext,
	},
	props: {
		getWithCache: {
			type: Function,
		},
		handleHtml: {
			type: Function,
			default: (html) => html,
		},
		loading: Number,
		manifestUrl: String,
	},
	data () {
		return {
			error: '',
			iiif: null,
			manifest: null,
			messages: null,
			options: {
				breakpoints: {
					large: 1350,
					medium: 1199 - 72,
					small: 700,
					tiny: 400,
				},
				immediateRender: true,
				keepZoomOnPageChange: false,
				language: 'de',
				manifest: null,
				queryParamName: 'v',
				title: '',
			},
			pageMapping: null,
			params: {},
			paramsTimer: null,
		}
	},
	computed: {
		iiifCanvases () {
			if (!this.iiif || !this.pageMapping) {
				return null
			}

			const mappings = this.pageMapping.trim().split(/\n/g).map(line => line.trim().split(','))

			const filteredIiifCanvases = []
			for (const mapping of mappings) {
				const canvas = this.iiif.sequences[0].canvases.find(iiifCanvas => {
					const id = iiifCanvas['@id']
					return id.substr(id.lastIndexOf('/') + 1) === mapping[1]
				})
				if (canvas) {
					filteredIiifCanvases.push(canvas)
				}
			}

			if (filteredIiifCanvases.length !== this.canvases.length) {
				// eslint-disable-next-line vue/no-side-effects-in-computed-properties
				this.error = 'Seiten aus IIIF-Manifest konnten nicht vollständig zugeordnet werden'
			}

			return filteredIiifCanvases
		},
		canvases () {
			return this.manifest.pages
		},
		pageCount () {
			return this.manifest.pages.length
		},
		visibleCanvases () {
			const visibleCanvases = []
			for (const page of this.params.pages) {
				if (page > 0) {
					const canvas = this.canvases[page - 1]
					canvas.permalink = `${window.location.origin}${this.$route.path}#${canvas.id}`
					visibleCanvases.push(canvas)
				}
			}
			return visibleCanvases
		},
	},
	watch: {
		// NOTE: Cannot use :class because responsive classes are added via classList below
		'params.view': function (newView, oldView) {
			this.$el.classList.remove(`-${oldView}`)
			this.$el.classList.add(`-${newView}`)
		},
	},
	methods: {
		getParams () {
			let params = {}
			try {
				const paramsString = this.getQueryParam(this.options.queryParamName) || ''
				params = JSON.parse(paramsString) || {}
			} catch (e) {
				// Nothing to do here
			}

			if (process.env.NODE_ENV === 'testing' || (this.isMobile() && !params.view)) {
				params.view = 'scan'
			} else if (typeof params.view === 'undefined') {
				params.view = 'info'
			}

			let pages
			if (this.isValidPagesArray(params.pages)) {
				pages = params.pages
			} else {
				if (params.pages) this.error = 'Ungültige Seiten, zeige erste Seite'
				pages = [1]
			}

			return {
				filters: params.filters || {},
				fullWidth: params.fullWidth,
				pages,
				panX: parseFloat(params.panX) || null,
				panY: parseFloat(params.panY) || null,
				rotation: parseInt(params.rotation, 10) || null,
				search: params.search,
				view: params.view,
				zoom: parseFloat(params.zoom) || null,
			}
		},
		getQueryParam (name) {
			const match = RegExp(`[?&]${name}=([^&]*)`).exec(window.location.search)
			return match && decodeURIComponent(match[1].replace(/\+/g, ' '))
		},
		init () {
			// Merging user-set query params with defaults
			window.addEventListener('popstate', this.setParams)
			this.setParams()

			// If page ID was provided, jump to this page, unless it's a note hash
			if (window.location.hash && window.location.hash.substr(0, 5) !== '#note') {
				const pageId = window.location.hash.substr(1)

				const newUrl = window.location.href.substr(0, window.location.href.indexOf('#'))
				window.history.replaceState({}, '', newUrl)

				const pageNumber = this.canvases.findIndex(canvas => canvas.id === pageId) + 1
				this.setPage(pageNumber || 1)

				this.params.view = 'fulltext'
			}

			this.$emit('setTitle', this.manifest.title)
			this.$emit('updateCustomCss', this.manifest.css)
		},
		isMobile () {
			return (this.$el.offsetWidth < this.options.breakpoints.medium)
		},
		isValidPagesArray (pages) {
			if (!Array.isArray(pages)) return false

			// Check for duplicates
			if ((new Set(pages)).size !== pages.length) return false

			for (let i = 0; i < pages.length; i += 1) {
				if (isNaN(pages[i]) ||
					(i > 0 && pages[i] > 0 && pages[i] <= pages[i - 1]) ||
					pages[i] < 0 ||
					pages[i] > this.pageCount
				) return false
			}

			return true
		},
		setPage (page) {
			const { pages } = this.params

			if (pages.length === 2) {
				let page2 = page + 1 > this.pageCount ? 0 : page + 1

				if (this.canvases[page - 1] && this.canvases[page - 1].id.substr(-1) !== 'v') {
					page2 = 0
				}

				if (page === 1 && page2 === 0) {
					page = 0
					page2 = 1
				}

				this.updateParams({ pages: [page, page2] })
				return
			}

			this.updateParams({ pages: [page] })
		},
		setParams () {
			this.params = this.getParams()
		},
		updateBreakpoint () {
			Object.keys(this.options.breakpoints).forEach((breakpoint) => {
				if (this.$el.clientWidth <= this.options.breakpoints[breakpoint]) {
					this.$el.classList.add(`-${breakpoint}`)
				} else {
					this.$el.classList.remove(`-${breakpoint}`)
				}
			})
		},
		updateParams (params) {
			Object.assign(this.params, params)

			if (!window.history) return

			clearTimeout(this.paramsTimeout)
			this.paramsTimeout = setTimeout(() => {
				// Not setting URL params if viewer is not active
				if (this.$route.path.indexOf('/reiseberichte/') !== 0) return

				const storedParams = {}
				Object.keys(this.params).forEach((key) => {
					const param = this.params[key]
					if (param === null ||
						(key === 'pages' && param.length < 2 && param[0] < 2) ||
						(typeof param === 'object' && !Object.keys(param).length)
					) {
						delete storedParams[key]
					} else {
						storedParams[key] = this.params[key]
					}
				})

				const regex = new RegExp(`([?&])${this.options.queryParamName}=.*?(&|$)`)

				const paramsString = JSON.stringify(storedParams)
				const viewParams = `${this.options.queryParamName}=${paramsString}`
				const uri = window.location.href
				const newUrl = uri.match(regex)
					? uri.replace(regex, `$1${viewParams}$2`)
					: `${uri}${uri.indexOf('?') < 0 ? '?' : '&'}${viewParams}`

				if (params.pages) {
					this.error = ''
					window.history.pushState({}, '', newUrl)
				} else {
					window.history.replaceState({}, '', newUrl)
				}
			}, 100)
		},
	},
	async mounted () {
		// Set current breakpoint as classes on container element for use in CSS
		window.addEventListener('resize', this.updateBreakpoint)
		this.updateBreakpoint()

		document.body.classList.add('-viewer')

		this.manifest = await this.getWithCache(this.manifestUrl)

		if (this.manifest.iiif_manifest) {
			this.iiif = await this.getWithCache(this.manifest.iiif_manifest, '', true)
			this.pageMapping = await this.getWithCache(this.manifest.page_mapping, '', true)
		} else {
			this.error = 'IIIF-Manifest-URL fehlt'
		}

		this.init()
	},
	beforeDestroy () {
		window.removeEventListener('resize', this.updateBreakpoint)
		window.removeEventListener('popstate', this.setParams)
		document.body.classList.remove('-viewer')
		this.$emit('updateCustomCss', null)

		this.$root.loading = 0 // TODO: This should not be set by the viewer
	},
}
</script>
