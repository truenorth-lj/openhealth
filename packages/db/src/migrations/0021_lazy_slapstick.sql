DROP INDEX "blog_posts_youtube_video_id_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "blog_posts_youtube_video_locale_idx" ON "blog_posts" USING btree ("youtube_video_id","locale");