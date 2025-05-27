document.getElementById("uploadBtn").onclick = async () => {
  const fileInput = document.getElementById("imageInput");
  if (!fileInput.files[0]) return alert("Please select an image.");
  const formData = new FormData();
  formData.append("image", fileInput.files[0]);

  const uploadRes = await fetch("/upload", {
    method: "POST",
    body: formData
  });

  const { imageUrl } = await uploadRes.json();
  const res = await fetch("/api/ghibli-style", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl })
  });

  const data = await res.json();
  if (data && data.output) {
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = `<img src="${data.output[0]}" width="300"/><br/>`;
    document.getElementById("saveBtn").style.display = "inline";
    document.getElementById("saveBtn").onclick = () => {
      const a = document.createElement("a");
      a.href = data.output[0];
      a.download = "ghibli-style.png";
      a.click();

      // Delete the uploaded file
      fetch("/delete-uploaded", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: imageUrl.split("/").pop() })
      });
    };
  } else {
    alert("Failed to get stylized image");
  }
};
