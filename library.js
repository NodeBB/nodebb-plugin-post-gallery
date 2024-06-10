'use strict';

const path = require('path');
const validator = require.main.require('validator');

const db = require.main.require('./src/database');
const posts = require.main.require('./src/posts');
const routeHelpers = require.main.require('./src/routes/helpers');

const plugin = module.exports;

plugin.init = async (params) => {
	const { router } = params;

	routeHelpers.setupPageRoute(router, '/post-gallery', async (req, res, next) => {
		let src = '';
		let uploads = [];
		let currentPid;
		let prevPid;
		let nextPid;
		if (req.query.pid) {
			currentPid = validator.escape(String(req.query.pid));
			const score = await db.sortedSetScore('nbb-post-gallery:pids', currentPid);
			if (!score) {
				return next();
			}

			const [prevs, nexts] = await Promise.all([
				db.getSortedSetRevRangeByScore('nbb-post-gallery:pids', 0, 1, score - 1, '-inf'), // max, min
				db.getSortedSetRangeByScore('nbb-post-gallery:pids', 0, 1, score + 1, '+inf'), // min, max
			]);

			prevPid = prevs.length ? prevs[0] : null;
			nextPid = nexts.length ? nexts[0] : null;
		} else {
			const pids = await db.getSortedSetRevRange('nbb-post-gallery:pids', 0, 1);
			currentPid = pids[0];
			prevPid = pids[1];
		}

		if (currentPid) {
			uploads = await posts.uploads.list(currentPid);

			uploads = uploads.map((upload, i) => {
				return {
					url: path.join('/assets/uploads', upload),
					selected: i == 0,
				}
			});
			if (uploads.length) {
				src = uploads[0].url;
			}
		}

		res.render('post-gallery', {
			title: 'Post Gallery',
			currentPid,
			prevPid,
			nextPid,
			src,
			uploads,
		});
	});
};

plugin.onPostSave = async (hookData) => {
	const { pid, timestamp } = hookData.post;
	const uploads = await posts.uploads.list(pid);
	const extensions = ['.jpg', '.jpeg', '.png', '.bmp'];
	const images = uploads.filter(u => u && extensions.some(ext => u.endsWith(ext)));
	if (images.length) {
		await db.sortedSetAdd(`nbb-post-gallery:pids`, timestamp, pid);
	}
};