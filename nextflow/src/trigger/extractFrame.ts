import { task } from "@trigger.dev/sdk/v3";

export const extractFrameTask = task({
    id: "extract-frame",
    maxDuration: 60,
    run: async (payload: {
        videoUrl: string;
        timestamp: number;
        unit: "sec" | "ms" | "pct";
    }) => {
        const { videoUrl, timestamp, unit } = payload;
        let ffmpeg: typeof import("fluent-ffmpeg");
        try {
            ffmpeg = (await import("fluent-ffmpeg")).default;
        } catch {
            throw new Error("fluent-ffmpeg not installed — run: npm i fluent-ffmpeg @types/fluent-ffmpeg");
        }
        let seekSec = timestamp;
        if (unit === "ms") seekSec = timestamp / 1000;
        const fs = await import("fs/promises");
        const path = await import("path");
        const os = await import("os");

        const tmpDir = os.tmpdir();
        const videoPath = path.join(tmpDir, `frame-input-${Date.now()}.mp4`);
        const outputPath = path.join(tmpDir, `frame-output-${Date.now()}.png`);

        const vidRes = await fetch(videoUrl);
        if (!vidRes.ok) throw new Error(`Failed to fetch video: ${vidRes.status}`);
        const vidBuf = Buffer.from(await vidRes.arrayBuffer());
        await fs.writeFile(videoPath, vidBuf);

        if (unit === "pct") {
            const duration = await getDuration(ffmpeg, videoPath);
            seekSec = (timestamp / 100) * duration;
        }
        await new Promise<void>((resolve, reject) => {
            ffmpeg(videoPath)
                .seekInput(seekSec)
                .frames(1)
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
            dataUrl: `data:image/png;base64,${b64}`,
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
