<template>
	<section class="viewer-search">
		<form @submit.prevent="updateResults">
			<label class="viewer-search_label">
				<h2>Suche in diesem Werk</h2>
				<input type="search" name="s" v-model="query" ref="input" class="viewer-search_input">
			</label>
		</form>
		<p>
			<router-link :to="extendedSearchHref" class="viewer-search_extended">
				Erweiterte Suche
			</router-link>
		</p>
		<div v-if="results" class="viewer-search_results">
			<h3 class="sr-only">Ergebnisse</h3>
			<ol class="viewer-search_list">
				<li v-for="result in results" class="viewer-search_item" :key="result.page">
					<a
						href="javascript:;"
						@click="$parent.setPage(getPageById(result.page)); $parent.updateParams({ view: 'fulltext' })"
					>
					<h4 class="viewer-search_page">{{result.title}}</h4></a>
					<div v-html="result.preview"/>
				</li>
			</ol>
		</div>
		<p v-else-if="!$parent.loading && $parent.params.search" class="viewer-search_info">
			Keine Treffer
		</p>
	</section>
</template>

<script>
export default {
	data () {
		return {
			query: this.$parent.params.search,
			results: null,
			submittedQuery: '',
		}
	},
	watch: {
		'$parent.params.view': function (view) {
			if (view === 'search') this.init()
		},
	},
	mounted () {
		this.init()
		this.updateResults()
	},
	computed: {
		extendedSearchHref () {
			return `/suche?s=${this.query ?? ''}&c=` + JSON.stringify({ post_id: this.$parent.manifest.post_id, type: 'fuzzy' })
		},
	},
	methods: {
		getPageById (pageId) {
			return this.$parent.canvases.findIndex(canvas => canvas.id === pageId) + 1
		},
		init () {
			this.$refs.input.focus()
		},
		updateResults () {
			// TODO: Update URL
			this.$parent.updateParams({ search: this.query })
			this.submittedQuery = this.query

			if (!this.query) {
				return
			}

			const params = {
				s: this.query,
				post_id: this.$parent.manifest.post_id,
			}

			// TODO: Cache this too?
			this.$http.get(`${process.env.VUE_APP_API_URL}/search2`, { params }).then((response) => {
				try {
					this.results = response.data.results.Reiseberichte[this.$parent.manifest.title]
				} catch (e) {
					this.results = null
				}
			})
		},
	},
}
</script>
