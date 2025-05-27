const BACKEND_URL = "https://ghibli-fxgy.onrender.com";

async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${BACKEND_URL}/upload`, {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  return data.imageUrl; // returns /uploads/filename.jpg
}

async function stylizeImage(imageUrl) {
  const res = await fetch(`${BACKEND_URL}/api/ghibli-style`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ image_url: imageUrl })
  });

  const data = await res.json();
  return data;
}

async function deleteUploaded(filename) {
  const res = await fetch(`${BACKEND_URL}/delete-uploaded`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ filename })
  });

  const data = await res.json();
  return data;
}
