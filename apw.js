// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA88fPkOvcI4QA9qD3ROpk-ay-V6ibQQlc",
  authDomain: "my-application-7fd40.firebaseapp.com",
  projectId: "my-application-7fd40",
  storageBucket: "my-application-7fd40.appspot.com",
  messagingSenderId: "269589994279",
  appId: "1:269589994279:web:4c617a622c328a1224e702",
  measurementId: "G-D8MD1J28GR",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// DOM elements
const topicsContainer = document.getElementById("topicsContainer");
const topicInput = document.getElementById("topicInput");
const addTopicBtn = document.getElementById("addTopicBtn");
const addSubtopicModal = document.getElementById("addSubtopicModal");
const modalTopicName = document.getElementById("modalTopicName");
const subtopicNameInput = document.getElementById("subtopicNameInput");
const subtopicLinkInput = document.getElementById("subtopicLinkInput");
const saveSubtopicBtn = document.getElementById("saveSubtopicBtn");
const cancelSubtopicBtn = document.getElementById("cancelSubtopicBtn");
const pasteArea = document.getElementById("pasteArea");
const imagePreviewContainer = document.getElementById("imagePreviewContainer");
const imagePreview = document.getElementById("imagePreview");
const imageUploadInput = document.getElementById("imageUploadInput");

// Current topic ID for subtopic addition and image data
let currentTopicId = null;
let imageFile = null;

// Load topics on page load
document.addEventListener("DOMContentLoaded", loadTopics);

// Add topic event
addTopicBtn.addEventListener("click", addTopic);

// Modal events
cancelSubtopicBtn.addEventListener("click", () => {
  addSubtopicModal.classList.add("hidden");
  clearSubtopicForm();
});

saveSubtopicBtn.addEventListener("click", addSubtopic);

// Paste image handler
document.addEventListener("paste", (e) => {
  if (!addSubtopicModal.classList.contains("hidden")) {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;

    for (const item of items) {
      if (item.type.indexOf("image") !== -1) {
        const blob = item.getAsFile();
        imageFile = blob;
        displayImagePreview(blob);
        break;
      }
    }
  }
});

// Click to upload handler
pasteArea.addEventListener("click", () => {
  imageUploadInput.click();
});

imageUploadInput.addEventListener("change", (e) => {
  if (e.target.files.length) {
    imageFile = e.target.files[0];
    displayImagePreview(imageFile);
  }
});

// Display image preview
function displayImagePreview(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.src = e.target.result;
    imagePreviewContainer.classList.remove("hidden");
    pasteArea.classList.add("hidden");
  };
  reader.readAsDataURL(file);
}

// Load all topics from Firestore
function loadTopics() {
  topicsContainer.innerHTML = "";

  db.collection("topics")
    .orderBy("createdAt", "desc")
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        displayTopic(doc.id, doc.data());
      });
    })
    .catch((error) => {
      console.error("Error loading topics: ", error);
    });
}

// Display a topic with its subtopics
function displayTopic(topicId, topicData) {
  const topicElement = document.createElement("div");
  topicElement.className = "bg-white rounded-lg shadow-md overflow-hidden";

  topicElement.innerHTML = `
        <div class="p-6">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-semibold text-gray-800">${topicData.name}</h2>
                <button class="add-subtopic-btn text-indigo-600 hover:text-indigo-800" data-topic-id="${topicId}">
                    <i class="fas fa-plus mr-1"></i>Add Subtopic
                </button>
            </div>
            <div class="subtopics-container-${topicId} space-y-3">
                <!-- Subtopic items will be added here -->
            </div>
        </div>
    `;

  topicsContainer.appendChild(topicElement);

  // Load subtopics for this topic
  loadSubtopics(topicId);

  // Add event listener to the add subtopic button
  topicElement
    .querySelector(`.add-subtopic-btn`)
    .addEventListener("click", (e) => {
      currentTopicId = e.currentTarget.getAttribute("data-topic-id");
      modalTopicName.textContent = topicData.name;
      addSubtopicModal.classList.remove("hidden");
    });
}

// Load subtopics for a specific topic
function loadSubtopics(topicId) {
  const subtopicsContainer = document.querySelector(
    `.subtopics-container-${topicId}`
  );
  subtopicsContainer.innerHTML = "";

  db.collection("topics")
    .doc(topicId)
    .collection("subtopics")
    .orderBy("createdAt", "desc")
    .get()
    .then((querySnapshot) => {
      if (querySnapshot.empty) {
        subtopicsContainer.innerHTML =
          '<p class="text-gray-500 italic">No subtopics added yet.</p>';
        return;
      }

      querySnapshot.forEach((doc) => {
        const subtopic = doc.data();
        const subtopicElement = document.createElement("div");
        subtopicElement.className =
          "bg-gray-50 p-4 rounded-lg border border-gray-200";

        subtopicElement.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h3 class="font-medium text-gray-800">${
                              subtopic.name
                            }</h3>
                            ${
                              subtopic.link
                                ? `<a href="${
                                    subtopic.link
                                  }" target="_blank" class="text-indigo-600 hover:underline text-sm mt-1 block">${formatLink(
                                    subtopic.link
                                  )}</a>`
                                : ""
                            }
                            ${
                              subtopic.imageUrl
                                ? `
                                <div class="mt-2">
                                    <img src="${subtopic.imageUrl}" alt="Subtopic image" class="max-h-40 rounded-lg border border-gray-200">
                                </div>
                            `
                                : ""
                            }
                        </div>
                        <button class="delete-subtopic-btn text-red-500 hover:text-red-700 ml-4" data-topic-id="${topicId}" data-subtopic-id="${
          doc.id
        }">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;

        subtopicsContainer.appendChild(subtopicElement);

        // Add event listener to delete button
        subtopicElement
          .querySelector(".delete-subtopic-btn")
          .addEventListener("click", (e) => {
            const topicId = e.currentTarget.getAttribute("data-topic-id");
            const subtopicId = e.currentTarget.getAttribute("data-subtopic-id");
            deleteSubtopic(topicId, subtopicId);
          });
      });
    })
    .catch((error) => {
      console.error("Error loading subtopics: ", error);
      subtopicsContainer.innerHTML =
        '<p class="text-red-500">Error loading subtopics.</p>';
    });
}

// Add a new topic
function addTopic() {
  const topicName = topicInput.value.trim();

  if (!topicName) {
    alert("Please enter a topic name");
    return;
  }

  db.collection("topics")
    .add({
      name: topicName,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .then(() => {
      topicInput.value = "";
      loadTopics();
    })
    .catch((error) => {
      console.error("Error adding topic: ", error);
      alert("Error adding topic. Please try again.");
    });
}

// Add a new subtopic
async function addSubtopic() {
  const name = subtopicNameInput.value.trim();
  const link = subtopicLinkInput.value.trim();

  if (!name) {
    alert("Please enter a subtopic name");
    return;
  }

  // Validate URL if provided
  if (link && !isValidUrl(link)) {
    alert("Please enter a valid URL (include http:// or https://)");
    return;
  }

  try {
    let imageUrl = null;

    // Upload image if exists
    if (imageFile) {
      const storageRef = storage
        .ref()
        .child(
          `subtopic-images/${currentTopicId}/${Date.now()}-${imageFile.name}`
        );
      const snapshot = await storageRef.put(imageFile);
      imageUrl = await snapshot.ref.getDownloadURL();
    }

    // Add subtopic document
    await db
      .collection("topics")
      .doc(currentTopicId)
      .collection("subtopics")
      .add({
        name: name,
        link: link || null,
        imageUrl: imageUrl || null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

    loadSubtopics(currentTopicId);
    addSubtopicModal.classList.add("hidden");
    clearSubtopicForm();
  } catch (error) {
    console.error("Error adding subtopic: ", error);
    alert("Error adding subtopic. Please try again.");
  }
}

// Delete a subtopic
async function deleteSubtopic(topicId, subtopicId) {
  if (!topicId || !subtopicId) {
    console.error("Invalid topicId or subtopicId");
    return;
  }

  if (!confirm("Are you sure you want to delete this subtopic?")) {
    return;
  }

  try {
    // First get the subtopic to check for image
    const subtopicDoc = await db
      .collection("topics")
      .doc(topicId)
      .collection("subtopics")
      .doc(subtopicId)
      .get();

    if (!subtopicDoc.exists) {
      throw new Error("Subtopic not found");
    }

    const subtopicData = subtopicDoc.data();

    // Delete the image from storage if exists
    if (subtopicData.imageUrl) {
      try {
        const imageRef = storage.refFromURL(subtopicData.imageUrl);
        await imageRef.delete();
      } catch (storageError) {
        console.error("Error deleting image:", storageError);
      }
    }

    // Delete the subtopic document
    await db
      .collection("topics")
      .doc(topicId)
      .collection("subtopics")
      .doc(subtopicId)
      .delete();

    loadSubtopics(topicId);
  } catch (error) {
    console.error("Error deleting subtopic: ", error);
    alert("Error deleting subtopic. Please try again.");
  }
}

// Helper function to format link for display
function formatLink(link) {
  try {
    const url = new URL(link);
    return url.hostname + (url.pathname !== "/" ? url.pathname : "");
  } catch {
    return link;
  }
}

// Helper function to validate URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Clear the subtopic form
function clearSubtopicForm() {
  subtopicNameInput.value = "";
  subtopicLinkInput.value = "";
  imageFile = null;
  imagePreview.src = "#";
  imagePreviewContainer.classList.add("hidden");
  pasteArea.classList.remove("hidden");
  currentTopicId = null;
}
