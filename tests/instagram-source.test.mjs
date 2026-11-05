import test from 'node:test';
import assert from 'node:assert/strict';
import { instagramVideoSource } from '../lib/instagram-source.ts';

const html = (url, shortcode = 'TestReel') => `requireLazy([],function(){server.handle(${JSON.stringify({contextJSON: JSON.stringify({gql_data:{shortcode_media:{shortcode,is_video:true,video_url:url}}})})})});`;
test('resolves only the requested original reel on Instagram video hosts', () => {
  const url = 'https://instagram.fmaa12-1.fna.fbcdn.net/o1/original.mp4?token=public-signed-url';
  assert.equal(instagramVideoSource(html(url), 'TestReel'), url);
  assert.throws(() => instagramVideoSource(html(url, 'AnotherReel'), 'TestReel'));
  assert.throws(() => instagramVideoSource('Instagram unavailable', 'TestReel'));
  for (const unsafe of ['https://evil.example/file.mp4','http://instagram.fna.fbcdn.net/file.mp4','https://fbcdn.net.evil.example/file.mp4','https://u:p@cdninstagram.com/file.mp4','https://cdninstagram.com/file.jpg']) {
    assert.throws(() => instagramVideoSource(html(unsafe), 'TestReel'));
  }
});
