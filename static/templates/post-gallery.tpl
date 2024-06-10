<div class="d-flex flex-column gap-3 flex-fill">
	<div class="d-flex flex-column gap-4">
		<div class="d-flex justify-content-center align-items-center mb-4" style="height: 50vh; max-height: 50vh;">
			<img class="p-2 text-bg-light border rounded shadow-sm"
				component="post-gallery/current" src="{src}" style="max-height: 50vh; max-width:100%;" />
		</div>
		{{{ if (uploads.length != "1") }}}
		<hr/>
		<div class="d-flex justify-content-center mb-3 gap-3">
		{{{ each uploads }}}
			<div>
				<img component="post-gallery/select" class="pointer rounded p-1 border border-3 {{{ if ./selected }}}border-primary{{{ end }}}" height="64px" style="width: auto;" src="{./url}"/>
			</div>
		{{{ end }}}
		</div>
		{{{ end }}}
	</div>

	<div class="d-flex gap-2 justify-content-between">
		<a href="{{{ if prevPid }}}{config.relative_path}/post-gallery?pid={prevPid}{{{ else }}}#{{{ end }}}" class="btn btn-sm btn-light {{{ if !prevPid }}}disabled{{{ end }}}"><i class="fa fa-chevron-left"></i> Previous Post</a>

		<a href="{config.relative_path}/post/{currentPid}" class="btn btn-sm btn-light">View Post</a>

		<a href="{{{ if nextPid }}}{config.relative_path}/post-gallery?pid={nextPid}{{{ else }}}#{{{ end }}}" class="btn btn-sm btn-light {{{ if !nextPid }}}disabled{{{ end }}}">Next Post <i class="fa fa-chevron-right"></i></a>
	</div>
</div>