// ===================================
// EngineeringsPk - Main JavaScript
// ===================================

// Form Validation
function validateForm(form) {
    const inputs = form.querySelectorAll('[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('is-invalid');
            isValid = false;
        } else {
            input.classList.remove('is-invalid');

            // Email validation
            if (input.type === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(input.value)) {
                    input.classList.add('is-invalid');
                    isValid = false;
                }
            }

            // Phone validation
            if (input.type === 'tel') {
                const phoneRegex = /^[0-9+\-\s()]+$/;
                if (!phoneRegex.test(input.value) || input.value.length < 10) {
                    input.classList.add('is-invalid');
                    isValid = false;
                }
            }
        }
    });

    return isValid;
}


// Typed.js Animation
const typed = new Typed(".auto-input", {
    strings: ["Welcome to Our Machinery Hub", "Welcome to Our Industry",],
    typeSpeed: 100,
    backSpeed: 80,
    loop: true
});


// <!-- Soap Production Line Section -->

$(document).ready(function () {
    $('.venobox').venobox();
});




// ==============Our Product Section===============================


// Configuration
const API_KEY = 'AIzaSyC0b0yXCiOMpmqKszY1edmSVVakItFhJFo';
const CHANNEL_USERNAME = '@EngineeringsPk';
const AUTO_SLIDE_INTERVAL = 4000;

// State
let videos = [];
let currentIndex = 0;
let slidesPerView = 3;
let autoSlideTimer = null;

// Elements
const loading = document.getElementById('loading');
const carouselContainer = document.getElementById('carouselContainer');
const carouselTrack = document.getElementById('carouselTrack');
const indicators = document.getElementById('indicators');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const videoModal = new bootstrap.Modal(document.getElementById('videoModal'));

// Initialize
init();

function init() {
    fetchVideos();
    updateSlidesPerView();
    window.addEventListener('resize', handleResize);
    prevBtn.addEventListener('click', () => { goToSlide(currentIndex - 1); resetAutoSlide(); });
    nextBtn.addEventListener('click', () => { goToSlide(currentIndex + 1); resetAutoSlide(); });

    document.getElementById('videoModal').addEventListener('hidden.bs.modal', () => {
        document.getElementById('videoPlayer').innerHTML = '';
        startAutoSlide();
    });
}

// Fetch videos from YouTube API
async function fetchVideos() {
    try {
        // Get channel ID
        const channelRes = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=${CHANNEL_USERNAME}&key=${API_KEY}`
        );
        const channelData = await channelRes.json();

        if (!channelData.items?.length) throw new Error('Channel not found');

        const uploadsId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

        // Get videos
        const videosRes = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=50&key=${API_KEY}`
        );
        const videosData = await videosRes.json();

        // Get video details to filter by duration
        const videoIds = videosData.items.map(item => item.snippet.resourceId.videoId).join(',');
        const detailsRes = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${API_KEY}`
        );
        const detailsData = await detailsRes.json();

        // Filter videos >= 1 minute
        videos = detailsData.items.filter(video => {
            const duration = parseDuration(video.contentDetails.duration);
            return duration >= 60;
        });

        loading.style.display = 'none';
        carouselContainer.style.display = 'block';
        renderCarousel();
        startAutoSlide();

    } catch (error) {
        console.error('Error fetching videos:', error);
        loading.innerHTML = '<p style="color: #dc3545;">Failed to load videos. Please try again.</p>';
    }
}

// Parse ISO 8601 duration
function parseDuration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
}

// Render carousel
function renderCarousel() {
    carouselTrack.innerHTML = '';
    indicators.innerHTML = '';

    // Create video cards
    videos.forEach((video, index) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';

        const card = document.createElement('div');
        card.className = 'video-card';
        card.onclick = () => openVideo(video.id, video.snippet.title);

        card.innerHTML = `
                    <div class="video-thumbnail">
                        <img src="${video.snippet.thumbnails.high.url}" alt="${video.snippet.title}" loading="lazy">
                        <div class="play-button">
                            <div class="play-icon"></div>
                        </div>
                    </div>
                    <div class="video-info">
                        <div class="video-title">${video.snippet.title}</div>
                        <div class="video-date">${formatDate(video.snippet.publishedAt)}</div>
                    </div>
                `;

        slide.appendChild(card);
        carouselTrack.appendChild(slide);
    });

    // Create indicators - limited to maximum 10
    const totalSlides = Math.ceil(videos.length / slidesPerView);
    const maxIndicators = Math.min(totalSlides, 5); // Maximum 10 indicators

    for (let i = 0; i < maxIndicators; i++) {
        const dot = document.createElement('button');
        dot.className = 'indicator';
        dot.onclick = () => { goToSlide(i); resetAutoSlide(); };
        if (i === 0) dot.classList.add('active');
        indicators.appendChild(dot);
    }
}

// Format date
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Update carousel position
function updateCarousel() {
    const slideWidth = 100 / slidesPerView;
    const offset = -currentIndex * slideWidth * slidesPerView;
    carouselTrack.style.transform = `translateX(${offset}%)`;

    // Update indicators
    const dots = indicators.querySelectorAll('.indicator');
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIndex);
    });
}

// Go to specific slide
function goToSlide(index) {
    const maxIndex = Math.ceil(videos.length / slidesPerView) - 1;
    if (index < 0) {
        currentIndex = maxIndex;
    } else if (index > maxIndex) {
        currentIndex = 0;
    } else {
        currentIndex = index;
    }
    updateCarousel();
}

// Auto slide
function startAutoSlide() {
    autoSlideTimer = setInterval(() => {
        goToSlide(currentIndex + 1);
    }, AUTO_SLIDE_INTERVAL);
}

function resetAutoSlide() {
    clearInterval(autoSlideTimer);
    startAutoSlide();
}

function stopAutoSlide() {
    clearInterval(autoSlideTimer);
}

// Open video modal
function openVideo(videoId, title) {
    stopAutoSlide();
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('videoPlayer').innerHTML = `
                <iframe 
                    src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            `;
    videoModal.show();
}

// Update slides per view based on screen size
function updateSlidesPerView() {
    if (window.innerWidth <= 768) {
        slidesPerView = 1;
    } else if (window.innerWidth <= 992) {
        slidesPerView = 2;
    } else {
        slidesPerView = 3;
    }
}

// Handle window resize
function handleResize() {
    const oldSlidesPerView = slidesPerView;
    updateSlidesPerView();
    if (oldSlidesPerView !== slidesPerView) {
        currentIndex = 0;
        renderCarousel();
        updateCarousel();
    }
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (document.querySelector('.modal.show')) return;

    if (e.key === 'ArrowLeft') {
        goToSlide(currentIndex - 1);
        resetAutoSlide();
    } else if (e.key === 'ArrowRight') {
        goToSlide(currentIndex + 1);
        resetAutoSlide();
    }
});
// Back to Top Button
const backToTop = document.getElementById("back-to-top");
window.addEventListener("scroll", function () {
    if (window.scrollY > 200) {
        backToTop.style.display = "block";
    } else {
        backToTop.style.display = "none";
    }
});

backToTop.addEventListener("click", function () {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});


function checkNavbarScroll() {
    const navbar = document.querySelector(".sa-navbar");

    if (window.scrollY > 80) {  // 80px scroll threshold
        navbar.classList.add("sa-navbar-scrolled");
    } else {
        navbar.classList.remove("sa-navbar-scrolled");
    }
}

// Page load ke waqt check karo
document.addEventListener("DOMContentLoaded", checkNavbarScroll);

// Scroll hone par check karo
document.addEventListener("scroll", checkNavbarScroll);

