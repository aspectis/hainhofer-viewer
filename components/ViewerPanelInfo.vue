<template>
	<section class="viewer-info">
		<h2 v-html="$parent.manifest.title"/>

		<template v-if="$parent.manifest.description">
			<h3 class="viewer-sr-only">Beschreibung</h3>
			<div class="viewer-info_description" v-html="$parent.handleHtml($parent.manifest.description)"/>
		</template>
	</section>
</template>

<script>
export default {
	watch: {
		// eslint-disable-next-line func-names
		'$parent.params.view': function (view) {
			if (view === 'info') {
				if (!this.isInited) this.init()
			}
		},
	},
	methods: {
		init () {
			this.isInited = true
		},
		isUrl (string) {
			// Poor man's URL check
			return /^https?:\/\//.test(string)
		},
	},
	mounted () {
		if (this.$parent.params.view === 'info') this.init()

		const host = `${window.location.protocol}//${window.location.host}`
		this.$el.addEventListener('click', (event) => {
			// Only go further if a link was clicked
			if (!event.target.closest('a')) {
				return
			}

			const href = event.target.getAttribute('href')
			if (!href ||
				href.substr(0, 1) === '#' ||
				(href.match(/^\w+:\/\//) && href.substr(0, host.length) !== host)
			) {
				// No href, or is anchor link, or is external link
				return
			}

			this.$router.push(href.replace(host, ''))
			event.preventDefault()
		})
	},
}
</script>
