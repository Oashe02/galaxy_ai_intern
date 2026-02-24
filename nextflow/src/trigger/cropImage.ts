import { task } from "@trigger.dev/sdk/v3";

export const cropImageTask = task({
    id: "crop-image",
    maxDuration: 30,
    run: async (payload: {
        imageUrl: string;
        x: number;
        y: number;
        w: number;
        h: number;
    }) => {
        const { imageUrl, x, y, w, h } = payload;

        if (!imageUrl) {
            throw new Error("No image provided");
        }

        let buf: Buffer;

        // Handle base64 data URLs directly (from browser FileReader)
        if (imageUrl.startsWith("data:")) {
            const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
            buf = Buffer.from(base64Data, "base64");
        } else if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
            // Only fetch real HTTP URLs
            const imgRes = await fetch(imageUrl);
            if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`);
            buf = Buffer.from(await imgRes.arrayBuffer());
        } else {
            throw new Error("Invalid image URL. Must be a data URL or HTTP URL.");
        }

        let sharp: typeof import("sharp");
        try {
            sharp = (await import("sharp")).default;
        } catch {
            throw new Error("sharp not installed — run: npm i sharp");
        }

        const meta = await sharp(buf).metadata();
        const imgW = meta.width ?? 0;
        const imgH = meta.height ?? 0;

        if (imgW === 0 || imgH === 0) {
            throw new Error("Could not read image dimensions");
        }

        const cropX = Math.round((x / 100) * imgW);
        const cropY = Math.round((y / 100) * imgH);
        const cropW = Math.round((w / 100) * imgW);
        const cropH = Math.round((h / 100) * imgH);
        const safeX = Math.max(0, Math.min(cropX, imgW));
        const safeY = Math.max(0, Math.min(cropY, imgH));
        const safeW = Math.max(1, Math.min(cropW, imgW - safeX));
        const safeH = Math.max(1, Math.min(cropH, imgH - safeY));

        const croppedBuf = await sharp(buf)
            .extract({ left: safeX, top: safeY, width: safeW, height: safeH })
            .png()
            .toBuffer();
        const b64 = croppedBuf.toString("base64");
        return {
            dataUrl: `data:image/png;base64,${b64}`,
            width: safeW,
            height: safeH,
            originalWidth: imgW,
            originalHeight: imgH,
        };
    },
});
