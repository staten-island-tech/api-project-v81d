import "./style.css";

const app: HTMLDivElement = document.querySelector("#app")!;
const formContainer: HTMLDivElement = document.createElement("div");

formContainer.className = "camera-container";
app.appendChild(formContainer);

function buildVideo(stream: MediaStream) {
  const video: HTMLVideoElement = document.createElement("video");

  video.className = "camera-container__camera";
  video.srcObject = stream;
  video.autoplay = true;

  formContainer.appendChild(video);
}

navigator.mediaDevices
  .getUserMedia({ video: true })
  .then((stream: MediaStream) => {
    buildVideo(stream);
  })
  .catch((e: Error) => {
    console.error("An error occurred displaying the camera:", e);

    const label: HTMLParagraphElement = document.createElement("p");
    label.innerHTML = "<strong>Camera Error</strong>: " + e.message;

    formContainer.appendChild(label);
  });
