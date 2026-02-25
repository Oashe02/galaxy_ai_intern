import { task } from "@trigger.dev/sdk/v3";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

export const extractFrameTask = task({
    id: "extract-frame",
    maxDuration: 120,
    run: async (payload: {
        videoUrl: string;
        timestamp: number;
        timestampUnit: "sec" | "ms" | "pct";
    }) => {
        const { videoUrl, timestamp, timestampUnit } = payload;

        let ffmpeg: typeof import("fluent-ffmpeg");
        let ffmpegPath: string;
        let ffprobePath: string;
        try {
            ffmpeg = (await import("fluent-ffmpeg")).default;
            ffmpegPath = (await import("ffmpeg-static")).default as string;
            ffprobePath = (await import("ffprobe-static")).path;
            ffmpeg.setFfmpegPath(ffmpegPath);
            ffmpeg.setFfprobePath(ffprobePath);
        } catch (err) {
            throw new Error("FFmpeg setup failed — ensure fluent-ffmpeg, ffmpeg-static, and ffprobe-static are installed.");
        }

        let seekSec = timestamp;
        if (timestampUnit === "ms") seekSec = timestamp / 1000;

        const tmpDir = os.tmpdir();
        const videoPath = path.join(tmpDir, `frame-input-${Date.now()}.mp4`);
        const outputPath = path.join(tmpDir, `frame-output-${Date.now()}.jpg`);

        let vidBuf: Buffer;

        if (videoUrl.startsWith("data:")) {
            const base64Data = videoUrl.replace(/^data:video\/\w+;base64,/, "");
            vidBuf = Buffer.from(base64Data, "base64");
        } else if (videoUrl.startsWith("http://") || videoUrl.startsWith("https://")) {
            const vidRes = await fetch(videoUrl);
            if (!vidRes.ok) throw new Error(`Failed to fetch video: ${vidRes.status}`);
            vidBuf = Buffer.from(await vidRes.arrayBuffer());
        } else {
            throw new Error("Invalid video URL. Must be a data URL or HTTP URL.");
        }

        await fs.writeFile(videoPath, vidBuf);

        if (timestampUnit === "pct") {
            const duration = await getDuration(ffmpeg, videoPath);
            seekSec = (timestamp / 100) * duration;
        }

        await new Promise<void>((resolve, reject) => {
            ffmpeg(videoPath)
                .seekInput(seekSec)
                .frames(1)
                .size("?x720") // Resize to 720p height to keep size small
                .outputOptions("-q:v", "2") // High quality JPG
                .output(outputPath)
                .on("end", () => resolve())
                .on("error", (err: Error) => reject(err))
                .run();
        });

        const frameBuf = await fs.readFile(outputPath);
        const b64 = frameBuf.toString("base64");

        await fs.unlink(videoPath).catch(() => { });
        await fs.unlink(outputPath).catch(() => { });

        return {
            dataUrl: `data:image/jpeg;base64,${b64}`,
            timestamp: seekSec,
        };
    },
});

function getDuration(ffmpeg: any, filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err: Error | null, data: any) => {
            if (err) return reject(err);
            resolve(data?.format?.duration ?? 0);
        });
    });
}
