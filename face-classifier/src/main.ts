import "./style.css";

const app: HTMLDivElement = document.querySelector("#app")!;
const formContainer: HTMLDivElement = document.createElement("div");

formContainer.className = "form-container";
app.appendChild(formContainer);

navigator.mediaDevices
  .getUserMedia({ video: true })
  .then((stream: MediaStream) => {
    const video = document.createElement("video");

    video.srcObject = stream;
    video.autoplay = true;

    formContainer.appendChild(video);
  })
  .catch((e: Error) => {
    console.error("An error occurred displaying the camera:", e);
  });
