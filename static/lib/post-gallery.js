'use strict';

define('forum/post-gallery', function () {
	const module = {};
	module.init = function () {
		$('[component="post-gallery/select"]').on('click', function () {
			$('[component="post-gallery/select"]').removeClass('border-primary');
			$('[component="post-gallery/current"]').attr('src', $(this).attr('src'));
			$(this).addClass('border-primary');
		});

	};
	return module;
});
