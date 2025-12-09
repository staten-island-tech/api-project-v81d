import "./style.css";

import "@fontsource/outfit";
import "@fontsource/noto-sans-jp";
import "@fontsource/noto-sans";
import "@fontsource/vazirmatn";

const DEFAULT_PREDICTION_ENDPOINT = "http://localhost:5000/predict";
const DEFAULT_API_SECRET = "public";

const dataStates: Record<string, any> = new Proxy(
  {
    captured: false,
    uploaded: false,
    acknowledged: false,
    predictionEndpoint:
      localStorage.getItem("predictionEndpoint") ?? DEFAULT_PREDICTION_ENDPOINT,
    apiSecret: localStorage.getItem("apiSecret") ?? DEFAULT_API_SECRET,
  },
  {
    set(target: Record<string, any>, property: string, value: any): true {
      target[property] = value;

      updateSubmitButtonState();
      updateStatusLabel();

      return true;
    },
  },
);

localStorage.setItem("predictionEndpoint", dataStates.predictionEndpoint);
localStorage.setItem("apiSecret", dataStates.apiSecret);

const app: HTMLDivElement = document.querySelector("#app")!;
const container: HTMLDivElement = document.createElement("div");

container.className =
  "overflow-scroll flex flex-col justify-start items-center gap-20 p-10 m-0 w-full h-full bg-base-300";

const header: HTMLDivElement = document.createElement("div");

header.className =
  "flex flex-col items-center text-center gap-5 p-0 m-0 w-full";

const title: HTMLHeadingElement = document.createElement("h1");

title.className = "text-4xl font-bold";
title.textContent = "Mood Lens";

const subtitle: HTMLHeadingElement = document.createElement("h2");

subtitle.className = "text-2xl";
subtitle.textContent =
  "A basic classifier that determines your mood based on your facial expression!";

const cardList: HTMLDivElement = document.createElement("div");

cardList.className = "flex flex-wrap justify-center gap-20 p-0 w-0 w-full";

header.appendChild(title);
header.appendChild(subtitle);
container.appendChild(header);
container.appendChild(cardList);
app.appendChild(container);

buildThemeSwitcher();
buildSettingsModal();

function buildThemeSwitcher() {
  const themeSwitcher: HTMLLabelElement = document.createElement("label");

  themeSwitcher.className = "swap swap-rotate z-9999 fixed top-5 left-5";
  themeSwitcher.innerHTML = `
  <input id="theme-input-checkbox" type="checkbox" class="theme-controller" value="dark" />
  <svg
    class="swap-off h-10 w-10 fill-current"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24">
    <path
      d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
  </svg>
  <svg
    class="swap-on h-10 w-10 fill-current"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24">
    <path
      d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
  </svg>
  `;

  const currentTheme: string = localStorage.getItem("theme") ?? "light";
  const themeCheckbox: HTMLInputElement = themeSwitcher.querySelector(
    "#theme-input-checkbox",
  )!;

  if (currentTheme === themeCheckbox.value) themeCheckbox.checked = true;
  document.documentElement.setAttribute("data-theme", currentTheme);

  themeCheckbox.addEventListener("change", () => {
    if (themeCheckbox.checked) {
      document.documentElement.setAttribute("data-theme", themeCheckbox.value);
      localStorage.setItem("theme", themeCheckbox.value);
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    }
  });

  container.prepend(themeSwitcher);
}

function buildSettingsModal() {
  const settingsDialogArea: HTMLDivElement = document.createElement("div");

  settingsDialogArea.className = "z-9999 fixed";
  settingsDialogArea.innerHTML = `
  <button class="btn btn-accent md:btn-primary fixed top-5 right-5 rounded-full" onclick="settings_modal.showModal()">Settings</button>
  <dialog id="settings_modal" class="modal modal-bottom sm:modal-middle">
    <div class="modal-box">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">✕</button>
      </form>
      <h3 class="text-lg font-bold">Settings</h3>
      <div class="flex flex-col gap-4 py-4">
        <p>Change API-related settings.</p>
        <label class="input w-full">
          Prediction Endpoint
          <input id="settings-input-endpoint" type="text" class="grow" placeholder="https://your-api-url.com/endpoint" value="${dataStates.predictionEndpoint ?? ""}" />
        </label>
        <label class="input w-full">
          API Secret
          <input id="settings-input-secret" type="password" class="grow" placeholder="Your API secret code" value="${dataStates.apiSecret ?? ""}" />
        </label>
      </div>
      <div role="alert" class="alert alert-success alert-dash hidden">
        <span id="settings-span-alert"></span>
      </div>
      <div class="modal-action flex justify-center w-full">
        <div class="flex justify-start w-full">
          <button id="settings-button-defaults" class="btn btn-secondary">Defaults</button>
        </div>
        <form method="dialog">
          <button class="btn">Close</button>
        </form>
        <button id="settings-button-save" class="btn btn-primary">Save</button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button></button>
    </form>
  </dialog>
  `;

  const endpointInput: HTMLInputElement = settingsDialogArea.querySelector(
    "#settings-input-endpoint",
  )!;
  const apiSecretInput: HTMLInputElement = settingsDialogArea.querySelector(
    "#settings-input-secret",
  )!;
  const alertText: HTMLSpanElement = settingsDialogArea.querySelector(
    "#settings-span-alert",
  )!;
  const defaultsButton: HTMLButtonElement = settingsDialogArea.querySelector(
    "#settings-button-defaults",
  )!;
  const saveButton: HTMLButtonElement = settingsDialogArea.querySelector(
    "#settings-button-save",
  )!;

  endpointInput.value = dataStates.predictionEndpoint;
  apiSecretInput.value = dataStates.apiSecret;

  defaultsButton.addEventListener("click", () => {
    endpointInput.value = DEFAULT_PREDICTION_ENDPOINT;
    apiSecretInput.value = DEFAULT_API_SECRET;

    dataStates.predictionEndpoint = DEFAULT_PREDICTION_ENDPOINT;
    dataStates.apiSecret = DEFAULT_API_SECRET;

    localStorage.setItem("predictionEndpoint", DEFAULT_PREDICTION_ENDPOINT);
    localStorage.setItem("apiSecret", DEFAULT_API_SECRET);

    alertText.textContent = "Settings restored to defaults.";
    alertText.parentElement!.classList.remove("hidden");

    setTimeout(() => alertText.parentElement!.classList.add("hidden"), 5000);
  });

  saveButton.addEventListener("click", () => {
    dataStates.predictionEndpoint = endpointInput.value;
    dataStates.apiSecret = apiSecretInput.value;

    localStorage.setItem("predictionEndpoint", dataStates.predictionEndpoint);
    localStorage.setItem("apiSecret", dataStates.apiSecret);

    alertText.textContent = "Settings saved successfully.";
    alertText.parentElement!.classList.remove("hidden");

    setTimeout(() => alertText.parentElement!.classList.add("hidden"), 5000);
  });

  container.prepend(settingsDialogArea);
}

function buildVideoCard(stream: MediaStream): [HTMLElement, HTMLVideoElement] {
  const card: HTMLDivElement = document.createElement("div");

  card.className = "card w-80 md:w-128 rounded-3xl bg-base-100 shadow-md";

  const figure: HTMLElement = document.createElement("figure");
  const video: HTMLVideoElement = document.createElement("video");

  video.className = "container__camera";
  video.srcObject = stream;
  video.autoplay = true;
  video.muted = true;

  const cardBody: HTMLDivElement = document.createElement("div");

  cardBody.className = "card-body gap-5 p-10";
  cardBody.innerHTML = `
  <h2 class="card-title">Camera Capture</h2>
  <p>
    Press the "Capture Frame" button to use the current frame of the video as the input.
    Make sure your face is clearly visible, facing the camera directly, and your background
    is as clear as possible.
  </p>
  <div class="card-actions justify-end gap-5">
    <button id="camera-button-discard" class="btn btn-seconary rounded-full" disabled>Discard Capture</button>
    <button id="camera-button-capture" class="btn btn-primary rounded-full">Capture Frame</button>
  </div>
  `;

  figure.appendChild(video);
  card.appendChild(figure);
  card.appendChild(cardBody);
  cardList.appendChild(card);

  return [figure, video];
}

function buildFormCard() {
  const card: HTMLDivElement = document.createElement("div");

  card.className =
    "card w-80 md:w-128 rounded-3xl bg-primary text-primary-content shadow-md";

  const cardBody: HTMLDivElement = document.createElement("div");

  cardBody.className = "card-body gap-5 p-10 h-full !grow-0";
  cardBody.innerHTML = `
  <h2 class="card-title">What's Your Mood?</h2>
  <div class="flex flex-col gap-5">
    <p>Upload an image or use the embedded camera to classify your mood!</p>
    <fieldset class="fieldset">
      <legend class="fieldset-legend text-primary-content">Pick an image</legend>
      <input id="form-input-file" class="file-input file-input-md w-full rounded-lg text-base-content disabled:text-base-content/20" type="file" accept="image/png,image/jpeg" />
      <label class="label">Max size 2 MB</label>
    </fieldset>
    <p>
      The default public API uses
      <a
        class="link link-accent"
        href="https://pypi.org/project/fer"
        target="_blank"
      >Facial Expression Recognition (FER)</a>
      for mood classification. FER is a free and open-source model trained on the
      <a
        class="link link-accent"
        href="https://www.kaggle.com/datasets/msambare/fer2013"
        target="_blank"
      >FER-2013 dataset</a>.
    </p>
    <p>
      User-uploaded files and user-captured content do not get saved after being sent to the API.
      All data is immediately destroyed upon the completion of a request.
    </p>
    <p>
      You can also use your own self-hosted endpoint by changing the URL and API secret in the
      settings.
    </p>
    <fieldset class="fieldset border-primary-content rounded-box border p-4">
      <legend class="fieldset-legend text-primary-content">Acknowledgement</legend>
      <label class="label text-wrap">
        <input id="form-input-consent" type="checkbox" class="checkbox border-primary-content text-primary-content" />
        I understand and wish to analyze my image.
      </label>
    </fieldset>
  </div>
  <div class="card-actions justify-end items-end gap-5 h-full">
    <div class="flex flex-wrap justify-end items-center gap-5">
      <label id="form-button-submit-label" class="label">Upload an image or capture a frame.</label>
      <button id="form-button-submit" class="btn rounded-full" disabled>Classify Picture</button>
    </div>
  </div>
  `;

  card.append(cardBody);
  cardList.appendChild(card);
}

function showAlert(title: string, message: string) {
  const id = `alert_modal_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const alertDialog: HTMLDialogElement = document.createElement("dialog");

  alertDialog.id = id;
  alertDialog.className = "modal modal-bottom sm:modal-middle z-9999 fixed";
  alertDialog.innerHTML = `
  <div class="modal-box">
    <form method="dialog">
      <button class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">✕</button>
    </form>
    <h3 class="text-lg font-bold">${title}</h3>
    <div class="flex flex-col gap-4 py-4">
      <p>${message}</p>
    </div>
    <div class="modal-action">
      <form method="dialog">
        <button class="btn">Okay!</button>
      </form>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button></button>
  </form>
  `;

  alertDialog.addEventListener("close", () => alertDialog.remove());

  container.appendChild(alertDialog);

  alertDialog.showModal();
}

function updateSubmitButtonState() {
  const submitButton = document.querySelector(
    "#form-button-submit",
  ) as HTMLButtonElement;

  if (!submitButton) return;

  submitButton.disabled = !(
    (dataStates.captured || dataStates.uploaded) &&
    dataStates.acknowledged &&
    dataStates.predictionEndpoint &&
    dataStates.apiSecret
  );
}

function updateStatusLabel() {
  const statusLabel = document.querySelector("#form-button-submit-label");

  if (!statusLabel) return;

  if (dataStates.captured) statusLabel.textContent = "Using captured frame.";
  else if (dataStates.uploaded)
    statusLabel.textContent = "Using uploaded file.";
  else statusLabel.textContent = "Upload an image or capture a frame.";
}

async function capturedImageToFile(): Promise<File | null> {
  const wrapper: HTMLDivElement | null =
    document.querySelector("#captured-frame");

  if (!wrapper) return null;

  const img: HTMLImageElement | null = wrapper.querySelector("img");

  if (!img) return null;

  const blob = await fetch(img.src).then((res) => res.blob());

  return new File([blob], "image.jpg", { type: "image/jpeg" });
}

function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

async function predictImage(file: File): Promise<any> {
  if (!isValidURL(dataStates.predictionEndpoint))
    throw new Error("The prediction endpoint is invalid.");

  const formData = new FormData();

  formData.append("image", file);

  try {
    const response = await fetch(dataStates.predictionEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${dataStates.apiSecret}`,
        skip_zrok_interstitial: "1",
      },
      body: formData,
    });

    if (response.status === 429)
      throw new Error(
        "Rate limit exceeded. Please try again after a few seconds.",
      );

    if (!response.ok) {
      let result: any;

      try {
        result = await response.json();
      } catch {
        result = { error: "Unknown server error" };
      }

      throw new Error(result.error || "Unknown server error");
    }

    const result = await response.json();

    if (!(await verifyHandshakeToken(result.handshake, dataStates.apiSecret)))
      throw new Error("The prediction endpoint is not compatible.");

    return result;
  } catch (err: any) {
    if (err instanceof TypeError)
      throw new Error(
        "Could not reach the prediction server. Check your endpoint or network connection.",
      );

    throw err;
  }
}

async function verifyHandshakeToken(
  token: string,
  secret: string,
  validitySeconds: number = 60,
): Promise<boolean> {
  try {
    const decodedStr = atob(token.replace(/-/g, "+").replace(/_/g, "/"));

    const dotIndex = decodedStr.indexOf(".");
    if (dotIndex === -1) return false;

    const messageStr = decodedStr.slice(0, dotIndex);
    const signatureStr = decodedStr.slice(dotIndex + 1);

    const messageBytes = new TextEncoder().encode(messageStr);
    const signatureBytes = new Uint8Array(
      [...signatureStr].map((c) => c.charCodeAt(0)),
    );

    const timestamp = parseInt(messageStr, 10);
    const now = Math.floor(Date.now() / 1000);
    if (now > timestamp + validitySeconds) return false;

    const key = new TextEncoder().encode(secret);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );

    // Verify HMAC
    const isValid = await crypto.subtle.verify(
      "HMAC",
      cryptoKey,
      signatureBytes,
      messageBytes,
    );

    return isValid;
  } catch {
    return false;
  }
}

navigator.mediaDevices
  .getUserMedia({ video: true })
  .then((stream: MediaStream) => {
    const [figure, video]: [HTMLElement, HTMLVideoElement] =
      buildVideoCard(stream);
    const captureButton: HTMLButtonElement = document.querySelector(
      "#camera-button-capture",
    )!;
    const discardButton: HTMLButtonElement = document.querySelector(
      "#camera-button-discard",
    )!;

    captureButton.addEventListener("click", () => {
      const canvas: HTMLCanvasElement = document.createElement("canvas");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageDataURL: string = canvas.toDataURL("image/jpeg");
        const wrapper: HTMLDivElement = document.createElement("div");

        wrapper.id = "captured-frame";
        wrapper.className = "relative inline-block";

        const img: HTMLImageElement = document.createElement("img");

        img.src = imageDataURL;
        img.width = canvas.width;
        img.height = canvas.height;

        const indicator: HTMLDivElement = document.createElement("div");

        indicator.className =
          "absolute top-5 right-5 w-4 h-4 rounded-full bg-primary shadow-md";
        indicator.title = "Captured Frame";

        video.style.display = "none";

        captureButton.disabled = true;
        discardButton.disabled = false;

        const fileInput: HTMLInputElement | null =
          document.querySelector("#form-input-file");

        if (fileInput) fileInput.disabled = true;

        wrapper.appendChild(img);
        wrapper.appendChild(indicator);
        figure.appendChild(wrapper);

        dataStates.captured = true;
      }
    });

    discardButton.addEventListener("click", () => {
      const wrapper: HTMLImageElement | null =
        document.querySelector("#captured-frame");

      if (!(dataStates.captured && wrapper)) return;

      wrapper.remove();
      video.style.removeProperty("display");

      captureButton.disabled = false;
      discardButton.disabled = true;

      const fileInput: HTMLInputElement | null =
        document.querySelector("#form-input-file");

      if (fileInput) fileInput.disabled = false;

      dataStates.captured = false;
    });
  })
  .catch((err: Error) => {
    container.insertAdjacentHTML(
      "afterbegin",
      `
    <div role="alert" class="alert alert-error alert-dash">
      <span><strong>Camera Error</strong>: ${err.message}</span>
    </div>
    `,
    );
  })
  .then(() => {
    buildFormCard();

    const submitButton: HTMLButtonElement = document.querySelector(
      "#form-button-submit",
    )!;
    const fileInput: HTMLInputElement =
      document.querySelector("#form-input-file")!;
    const consentInput: HTMLInputElement = document.querySelector(
      "#form-input-consent",
    )!;

    submitButton.addEventListener("click", async () => {
      if (!dataStates.acknowledged) {
        showAlert(
          "Missing Acknowledgement",
          "You did not complete the acknowledgement. To proceed, please check the box.",
        );
        return;
      }

      if (!(dataStates.predictionEndpoint && dataStates.apiSecret)) {
        showAlert(
          "Invalid API Settings",
          "Please enter a valid prediction endpoint and API secret in your settings.",
        );
        return;
      }

      const originalLabel: string = submitButton.textContent;

      submitButton.innerHTML = `<span class="loading loading-dots loading-md"></span>`;
      submitButton.disabled = true;

      if (dataStates.captured) {
        const file: File | null = await capturedImageToFile();

        if (!file) {
          showAlert(
            "Invalid Capture",
            "Please capture a valid frame before submitting.",
          );
          return;
        }

        try {
          const result = await predictImage(file);
          const topEmotion = result.topEmotion;

          showAlert(
            "Your Mood",
            `I'm ${Math.round(result.emotions[topEmotion] * 100)}% confident your top emotion is: ${topEmotion}!`,
          );
        } catch (err: any) {
          showAlert("Error", err.message);
        }
      } else if (dataStates.uploaded) {
        const fileList: FileList | null = fileInput.files;

        if (!fileList) {
          showAlert(
            "Invalid File",
            "Please upload a valid file or capture a frame before submitting.",
          );
          return;
        }

        const file: File | null = fileList[0];

        try {
          const result = await predictImage(file);
          const topEmotion = result.topEmotion;

          showAlert(
            "Your Mood",
            `I'm ${Math.round(result.emotions[topEmotion] * 100)}% confident your top emotion is ${topEmotion}!`,
          );
        } catch (err: any) {
          showAlert("Error", err.message);
        }
      } else
        showAlert(
          "Missing File",
          "Please upload a valid file or capture a frame before submitting.",
        );

      submitButton.textContent = originalLabel;
      submitButton.disabled = false;
    });

    fileInput.addEventListener("change", () => {
      if (fileInput.files) dataStates.uploaded = true;
      else dataStates.uploaded = false;
    });

    consentInput.addEventListener("change", () => {
      if (consentInput.checked) dataStates.acknowledged = true;
      else dataStates.acknowledged = false;
    });
  });
