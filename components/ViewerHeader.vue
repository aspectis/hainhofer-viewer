<template>
	<header class="viewer-header">
		<div class="viewer-header_column -title">
			<h1 class="viewer-header_title">
				{{ this.$parent.manifest.title }}
				<small v-if="this.$parent.manifest.label">({{ this.$parent.manifest.label }})</small>
			</h1>
		</div>

		<div class="viewer-header_column -pagination">
			<div class="viewer-header_button-group">
				<PageSelect class="viewer-header_button"/>
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
					:class="{ '-active': $parent.params.view === 'info' }"
					@click="toggleView('info')"
				>
					<IconInfoOutline decorative/>
					Info
				</button>

				<button
					class="viewer-header_button -scan"
					:class="{ '-active': $parent.params.view === 'scan' }"
					@click="toggleView('scan')"
				>
					<IconImage decorative/>
					Scan
				</button>

				<button
					class="viewer-header_button"
					:class="{ '-active': $parent.params.view === 'fulltext' }"
					@click="toggleView('fulltext')"
				>
					<IconSubject decorative/>
					Transkription
				</button>

				<button
					class="viewer-header_button"
					:class="{ '-active': $parent.params.view === 'thumbnails' }"
					@click="toggleView('thumbnails')"
				>
					<IconViewModule decorative/>
					Seiten
				</button>

				<button
					class="viewer-header_button"
					:class="{ '-active': $parent.params.view === 'download' }"
					@click="toggleView('download')"
				>
					<IconDownload decorative/>
					Download
				</button>

				<button
					class="viewer-header_button"
					:class="{ '-active': $parent.params.view === 'search' }"
					@click="toggleView('search')"
				>
					<IconSearch decorative/>
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
import IconDownload from 'vue-material-design-icons/Download'
import IconFirstPage from 'vue-material-design-icons/PageFirst'
import IconImage from 'vue-material-design-icons/Image'
import IconHelp from 'vue-material-design-icons/HelpCircleOutline'
import IconInfoOutline from 'vue-material-design-icons/InformationOutline'
import IconLastPage from 'vue-material-design-icons/PageLast'
import IconNavigateBefore from 'vue-material-design-icons/ChevronLeft'
import IconNavigateNext from 'vue-material-design-icons/ChevronRight'
import IconSearch from 'vue-material-design-icons/Magnify'
import IconSubject from 'vue-material-design-icons/TextSubject'
import IconViewModule from 'vue-material-design-icons/ViewModule'
import IconVisibility from 'vue-material-design-icons/EyeOutline'

import PageSelect from './ViewerPageSelect'

import keyboard from '../mixins/keyboard'
import pagination from '../mixins/pagination'

export default {
	components: {
		IconDownload,
		IconFirstPage,
		IconHelp,
		IconImage,
		IconInfoOutline,
		IconLastPage,
		IconNavigateBefore,
		IconNavigateNext,
		IconSearch,
		IconSubject,
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
		toggleView (name) {
			const view = (name === this.$parent.params.view && !this.$parent.isMobile() ? '' : name)
			this.$parent.updateParams({ view })
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
