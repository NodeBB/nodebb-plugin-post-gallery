'use strict';

const path = require('path');
const nconf = nodebb.require('nconf');

const db = nodebb.require('./src/database');
const posts = nodebb.require('./src/posts');
const routeHelpers = nodebb.require('./src/routes/helpers');
const privileges = nodebb.require('./src/privileges');

const plugin = module.exports;

const pidsKey = 'nbb-post-gallery:pids';

plugin.init = async (params) => {
	const { router } = params;

	routeHelpers.setupPageRoute(router, '/post-gallery', async (req, res, next) => {
		const uploadUrl = nconf.get('upload_url');
		let src = '';
		let uploads = [];
		let currentPid;
		if (req.query.pid) {
			currentPid = String(req.query.pid);
			if (!(await privileges.posts.can('topics:read', currentPid, req.uid))) {
				return next();
			}
		} else {
			currentPid = await getReadablePids(req.uid,
				(offset, pageSize) => db.getSortedSetRevRange(pidsKey, offset, offset + pageSize - 1)
			);
		}

		const score = await db.sortedSetScore(pidsKey, currentPid);
		if (!score) {
			return next();
		}

		const [prevPid, nextPid] = await Promise.all([
			getPrevPid(req.uid, score),
			req.query.pid ? getNextPid(req.uid, score) : null,
		]);

		if (currentPid) {
			uploads = await posts.uploads.list(currentPid);
			uploads = uploads.map((upload, i) => ({ url: path.join(uploadUrl, upload), selected: i == 0 }));
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

async function getReadablePids(uid, dbMethod) {
	let foundPid;
	let offset = 0;
	const pageSize = 20;
	while (!foundPid) {
		const pids = await dbMethod(offset, pageSize);
		if (!pids.length) break;
		const readablePids = await privileges.posts.filter('topics:read', pids, uid);
		if (readablePids.length) {
			foundPid = readablePids[0];
			break;
		}
		offset += pageSize;
	}
	return foundPid;
}

async function getPrevPid(uid, score) {
	return await getReadablePids(uid,
		(offset, pageSize) => db.getSortedSetRevRangeByScore(pidsKey, offset, pageSize, score - 1, '-inf')
	);
}

async function getNextPid(uid, score) {
	return await getReadablePids(uid,
		(offset, pageSize) => db.getSortedSetRangeByScore(pidsKey, offset, pageSize, score + 1, '+inf')
	);
}

plugin.onPostSave = async (hookData) => {
	const { pid, timestamp } = hookData.post;
	const uploads = await posts.uploads.list(pid);
	const extensions = ['.jpg', '.jpeg', '.png', '.bmp'];
	const images = uploads.filter(u => u && extensions.some(ext => u.endsWith(ext)));
	if (images.length) {
		await db.sortedSetAdd(pidsKey, timestamp, pid);
	}
};

plugin.onPostRestore = async (hookData) => {
	// will readd to zadd if post has uploads
	await plugin.onPostSave(hookData);
};

plugin.onPostDelete = async (hookData) => {
	const { post } = hookData;
	if (post && post.pid) {
		await db.sortedSetRemove(pidsKey, post.pid);
	}
};

plugin.onPostsPurge = async (hookData) => {
	const { posts } = hookData;
	if (Array.isArray(posts) && posts.length) {
		await db.sortedSetRemove(pidsKey, posts.map(p => p && p.pid));
	}
};