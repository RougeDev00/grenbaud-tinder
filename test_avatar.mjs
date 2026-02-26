// Test Gemini 2.5 Flash Image + Imagen 4 for avatar generation
const API_KEY = "AIzaSyCQnUpPf2VjyA8WAX75V3ZmTV6k-ZkBao0";

const prompt = `Generate a 3D rendered portrait bust of a young Italian man, age 22, with short brown hair, brown eyes, light stubble. 
Style: Pixar-style 3D character render, soft studio lighting, clean neutral gray background, high detail skin texture.
The character is looking directly at the camera with a friendly warm expression, shoulders visible.
High quality 3D render, octane render quality, consistent art style suitable for a social media avatar.`;

async function tryGeminiFlashImage() {
    console.log("🎨 [1/2] Trying gemini-2.5-flash-image...");

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseModalities: ["IMAGE", "TEXT"]
                }
            })
        }
    );

    if (!response.ok) {
        const err = await response.text();
        console.log(`❌ gemini-2.5-flash-image: ${response.status}`);
        console.log(err.substring(0, 200));
        return false;
    }

    const data = await response.json();
    return await saveImage(data, "gemini_flash_image");
}

async function tryImagen4() {
    console.log("\n🎨 [2/2] Trying imagen-4.0-generate-001...");

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${API_KEY}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                instances: [{ prompt }],
                parameters: {
                    sampleCount: 1,
                    aspectRatio: "1:1"
                }
            })
        }
    );

    if (!response.ok) {
        const err = await response.text();
        console.log(`❌ imagen-4.0: ${response.status}`);
        console.log(err.substring(0, 200));
        return false;
    }

    const data = await response.json();
    if (data.predictions?.[0]?.bytesBase64Encoded) {
        const fs = await import("fs");
        const buffer = Buffer.from(data.predictions[0].bytesBase64Encoded, "base64");
        fs.writeFileSync("test_avatar_imagen4.png", buffer);
        console.log(`✅ Imagen 4 avatar saved! → test_avatar_imagen4.png (${(buffer.length / 1024).toFixed(1)} KB)`);
        return true;
    }
    console.log("⚠️ Unexpected:", JSON.stringify(data, null, 2).substring(0, 300));
    return false;
}

async function saveImage(data, prefix) {
    const parts = data.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
        if (part.inlineData) {
            const fs = await import("fs");
            const buffer = Buffer.from(part.inlineData.data, "base64");
            const ext = (part.inlineData.mimeType || "").includes("png") ? "png" : "jpg";
            const filename = `test_avatar_${prefix}.${ext}`;
            fs.writeFileSync(filename, buffer);
            console.log(`✅ Avatar saved! → ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
            return true;
        }
        if (part.text) {
            console.log("📝 Text:", part.text.substring(0, 150));
        }
    }
    console.log("⚠️ No image found in response");
    return false;
}

// Run both tests
const r1 = await tryGeminiFlashImage();
const r2 = await tryImagen4();

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("Results:");
console.log(`  gemini-2.5-flash-image: ${r1 ? "✅" : "❌"}`);
console.log(`  imagen-4.0:             ${r2 ? "✅" : "❌"}`);
if (r1 || r2) console.log("\n🎉 Open the saved file(s) to see the avatar!");
