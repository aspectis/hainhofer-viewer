<template>
	<section class="viewer-download">
		<template v-if="$parent.manifest.files.length">
			<h2>Ganzes Werk</h2>
			<ul class="viewer-download_files">
				<li v-for="file in $parent.manifest.files" :key="file.url">
					<a class="viewer-download_link" :href="file.url" download>
						<div class="viewer-download_icon">
							<IconPdf v-if="file.url.substr(-4) === '.pdf'" decorative/>
							<IconTxt v-else-if="file.url.substr(-4) === '.txt'" decorative/>
							<IconXml v-else-if="file.url.substr(-4) === '.xml'" decorative/>
							<IconFile v-else decorative/>
						</div>
						{{ file.type }}
					</a>
				</li>
			</ul>
		</template>

		<h2>
			{{
				$parent.params.pages.length === 1
				? 'Angezeigte Seite'
				: 'Angezeigte Seiten'
			}}
		</h2>

		<h3>Bilddateien in hoher Auflösung</h3>
		<ul class="viewer-download_files">
			<li v-for="canvas in $parent.visibleCanvases" :key="canvas.id">
				<a class="viewer-download_link" :href="canvas.max_url" download>
					<div class="viewer-download_icon">
						<IconImage title="JPEG"/>
					</div>
					{{ canvas.label }}
				</a>
			</li>
		</ul>

		<h3>Wolfenbütteler Digitale Bibliothek <small>(weitere Bild-Download-Optionen)</small></h3>
		<ul class="viewer-download_files">
			<li v-for="canvas in $parent.visibleCanvases" :key="canvas.id">
				<a class="viewer-download_link" :href="canvas.wdb_url">
					<div class="viewer-download_icon">
						<IconExternal title="Externer Link"/>
					</div>
					{{ canvas.label }}
				</a>
			</li>
		</ul>
	</section>
</template>

<script>
import IconExternal from 'vue-material-design-icons/OpenInNew'
import IconFile from 'vue-material-design-icons/FileOutline'
import IconImage from 'vue-material-design-icons/ImageOutline'
import IconTxt from 'vue-material-design-icons/FileDocumentOutline'
import IconPdf from 'vue-material-design-icons/FilePdfOutline'
import IconXml from 'vue-material-design-icons/Xml'

export default {
	components: {
		IconExternal,
		IconFile,
		IconImage,
		IconPdf,
		IconTxt,
		IconXml,
	},
}
</script>
