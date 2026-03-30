
const BACKEND_URL = "https://ghibli-fxgy.onrender.com";
let uploadedFilename = "";

document.getElementById("uploadInput").addEventListener("change", async function () {
  const file = this.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${BACKEND_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (data.imageUrl) {
    const imageUrl = `${BACKEND_URL}${data.imageUrl}`;
    uploadedFilename = data.imageUrl.split("/").pop();
    document.getElementById("preview").src = imageUrl;
    document.getElementById("preview").style.display = "block";
    document.getElementById("convertBtn").disabled = false;
  }
});

document.getElementById("convertBtn").addEventListener("click", async function () {
  const imageUrl = document.getElementById("preview").src;

  const response = await fetch(`${BACKEND_URL}/api/ghibli-style`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl }),
  });

  const result = await response.json();
  const outputUrl = result?.output?.[0];

  if (outputUrl) {
    const outputImg = document.getElementById("stylized");
    outputImg.src = outputUrl;
    outputImg.style.display = "block";
    document.getElementById("saveBtn").style.display = "inline-block";
  }
});

document.getElementById("saveBtn").addEventListener("click", async function () {
  const stylizedImg = document.getElementById("stylized").src;
  const a = document.createElement("a");
  a.href = stylizedImg;
  a.download = "ghibli-style.png";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  await fetch(`${BACKEND_URL}/delete-uploaded`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: uploadedFilename }),
  });

  document.getElementById("preview").style.display = "none";
  document.getElementById("saveBtn").style.display = "none";
  document.getElementById("convertBtn").disabled = true;
});
