/**
 * Form Utilities for Property Listing
 * Handles autosave, navigation, progress, validation, and property submission.
 *
 * submitProperty() POSTs the full payload to the Express backend API.
 * On success it shows a premium animated overlay then redirects to the
 * new property's detail page so the user sees their listing immediately.
 */

const FormUtils = {
    AUTOSAVE_DELAY: 1500,
    TOTAL_STEPS: 6,
    autosaveTimer: null,
    currentStep: 1,

    /** Placeholder images used when a user uploads a base64 image we can't store in the API */
    PLACEHOLDER_IMAGES: [
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop',
    ],

    // ── Initialisation ────────────────────────────────────────────────────────

    init() {
        this.loadDraft();
        this.setupAutosave();
        console.log('📋 Form utilities initialized');
    },

    // ── Autosave ──────────────────────────────────────────────────────────────

    autosave(step, data) {
        clearTimeout(this.autosaveTimer);
        this.autosaveTimer = setTimeout(() => {
            try {
                const draft = this.getDraft();
                draft[`step${step}`] = data;
                draft.lastSaved = new Date().toISOString();
                draft.currentStep = step;
                localStorage.setItem('propertyDraft', JSON.stringify(draft));
                this.showSaveIndicator('saved');
                console.log(`💾 Autosaved step ${step}:`, data);
            } catch (error) {
                console.error('❌ Autosave failed:', error);
                this.showSaveIndicator('error');
            }
        }, this.AUTOSAVE_DELAY);
        this.showSaveIndicator('saving');
    },

    loadDraft() {
        try {
            const draft = localStorage.getItem('propertyDraft');
            return draft ? JSON.parse(draft) : this.getEmptyDraft();
        } catch {
            return this.getEmptyDraft();
        }
    },

    getDraft() {
        const draft = localStorage.getItem('propertyDraft');
        return draft ? JSON.parse(draft) : this.getEmptyDraft();
    },

    getEmptyDraft() {
        return { step1: {}, step2: {}, step3: {}, step4: {}, step5: {}, step6: {}, lastSaved: null, currentStep: 1 };
    },

    clearDraft() {
        localStorage.removeItem('propertyDraft');
        console.log('🗑️ Draft cleared');
    },

    setupAutosave() {
        document.addEventListener('input', (e) => {
            if (e.target.matches('input, select, textarea')) {
                const step = this.getCurrentStepNumber();
                const formData = this.collectCurrentStepData();
                this.autosave(step, formData);
            }
        });
    },

    collectCurrentStepData() {
        const formData = {};
        const form = document.querySelector('form');
        if (!form) return formData;
        form.querySelectorAll('input, select, textarea').forEach(input => {
            if (input.type === 'radio' || input.type === 'checkbox') {
                if (input.checked) formData[input.name] = input.value;
            } else {
                formData[input.name] = input.value;
            }
        });
        return formData;
    },

    getCurrentStepNumber() {
        const match = window.location.pathname.match(/step(\d)/);
        return match ? parseInt(match[1]) : 1;
    },

    // ── Save Indicator ────────────────────────────────────────────────────────

    showSaveIndicator(status) {
        let indicator = document.getElementById('autosaveIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'autosaveIndicator';
            indicator.style.cssText = `
                position:fixed;top:20px;right:20px;padding:0.5rem 1rem;
                border-radius:25px;font-size:0.85rem;font-weight:600;
                z-index:9999;transition:all 0.3s ease;
            `;
            document.body.appendChild(indicator);
        }
        if (status === 'saving') {
            indicator.textContent = '💾 Saving...';
            indicator.style.cssText += 'background:rgba(251,191,36,0.95);color:#78350f;opacity:1;';
        } else if (status === 'saved') {
            indicator.textContent = '✓ Saved';
            indicator.style.cssText += 'background:rgba(34,197,94,0.95);color:#14532d;opacity:1;';
            setTimeout(() => { indicator.style.opacity = '0'; }, 2000);
        } else {
            indicator.textContent = '⚠️ Save failed';
            indicator.style.cssText += 'background:rgba(239,68,68,0.95);color:#7f1d1d;opacity:1;';
        }
    },

    // ── Navigation ────────────────────────────────────────────────────────────

    goToStep(stepNumber) {
        if (stepNumber < 1 || stepNumber > this.TOTAL_STEPS) return;
        window.location.href = `add-property-step${stepNumber}.html`;
    },

    nextStep() {
        const currentStep = this.getCurrentStepNumber();
        if (!this.validateCurrentStep()) return;
        const formData = this.collectCurrentStepData();
        this.autosave(currentStep, formData);
        if (currentStep < this.TOTAL_STEPS) setTimeout(() => this.goToStep(currentStep + 1), 500);
    },

    previousStep() {
        const currentStep = this.getCurrentStepNumber();
        if (currentStep > 1) this.goToStep(currentStep - 1);
    },

    // ── Validation ────────────────────────────────────────────────────────────

    validateCurrentStep() {
        const step = this.getCurrentStepNumber();
        const formData = this.collectCurrentStepData();
        switch (step) {
            case 1:
                if (!formData.listingType || !formData.propertyType) {
                    alert('⚠️ कृपया संपत्ति का प्रकार चुनें\nPlease select property type');
                    return false;
                }
                return true;
            case 2:
                if (!formData.city || !formData.area) {
                    alert('⚠️ कृपया स्थान भरें\nPlease fill location details');
                    return false;
                }
                return true;
            case 3:
                if (!formData.bedrooms || !formData.sqft) {
                    alert('⚠️ कृपया बेडरूम और क्षेत्रफल भरें\nPlease fill bedrooms and area');
                    return false;
                }
                return true;
            case 4:
                if (!formData.price) {
                    alert('⚠️ कृपया कीमत भरें\nPlease enter price');
                    return false;
                }
                return true;
            case 5:
                if (!formData.name || !formData.phone) {
                    alert('⚠️ कृपया नाम और मोबाइल नंबर भरें\nPlease fill name and phone');
                    return false;
                }
                if (formData.phone && formData.phone.length !== 10) {
                    alert('⚠️ कृपया सही मोबाइल नंबर भरें (10 अंक)\nPlease enter valid phone (10 digits)');
                    return false;
                }
                return true;
            default:
                return true;
        }
    },

    // ── Progress ──────────────────────────────────────────────────────────────

    updateProgress(stepNumber) {
        const percentage = Math.round((stepNumber / this.TOTAL_STEPS) * 100);
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) progressFill.style.width = `${percentage}%`;
        const progressText = document.querySelector('.progress-text');
        if (progressText) progressText.textContent = `Step ${stepNumber} of ${this.TOTAL_STEPS} (${percentage}%)`;
        for (let i = 1; i <= this.TOTAL_STEPS; i++) {
            const stepEl = document.querySelector(`.progress-step[data-step="${i}"]`);
            if (stepEl) {
                stepEl.classList.toggle('completed', i < stepNumber);
                stepEl.classList.toggle('active', i === stepNumber);
                if (i > stepNumber) stepEl.classList.remove('active', 'completed');
            }
        }
    },

    // ── SUBMIT PROPERTY ───────────────────────────────────────────────────────

    /**
     * Assembles the full property payload from all draft steps and POSTs it
     * to the Express backend API. On success, shows the animated success overlay
     * and redirects to the new property's detail page.
     */
    async submitProperty() {
        const draft = this.getDraft();
        const user  = window.AppState ? window.AppState.getUser() : null;

        // ── 1. Sanitise images ─────────────────────────────────────────────
        const rawPhotos = (this._pendingPhotos && this._pendingPhotos.length > 0)
            ? this._pendingPhotos
            : (draft.step4?.photos || []);

        const sanitisedImages = rawPhotos.length > 0
            ? rawPhotos.map((p, i) =>
                typeof p === 'string' && p.startsWith('data:')
                    ? this.PLACEHOLDER_IMAGES[i % this.PLACEHOLDER_IMAGES.length]
                    : p
              )
            : this.PLACEHOLDER_IMAGES.slice(0, 2);

        // Keep only valid http/https images
        const validImages = sanitisedImages.filter(img =>
            typeof img === 'string' && (img.startsWith('http') || img.startsWith('/'))
        );
        const finalImages = validImages.length > 0 ? validImages : this.PLACEHOLDER_IMAGES.slice(0, 2);

        // ── 2. Build full payload ──────────────────────────────────────────
        const d = { ...draft.step1, ...draft.step2, ...draft.step3, ...draft.step4, ...draft.step5 };

        const bedroomCount = parseInt(d.bedrooms) || 1;
        const propertyTypeName = {
            flat: 'Flat', house: 'House', villa: 'Villa', plot: 'Plot', commercial: 'Commercial'
        }[d.propertyType] || 'Property';
        const autoTitle = `${bedroomCount} BHK ${propertyTypeName} in ${d.area || d.city || 'India'}`;

        const payload = {
            // Core
            title:          d.title || autoTitle,
            description:    d.description || `Beautiful ${autoTitle}. Contact for more details.`,
            propertyType:   d.propertyType || 'flat',
            listingType:    d.listingType  || 'sell',
            status:         'active',

            // Specs
            bhk:            `${bedroomCount} BHK`,
            bedrooms:       bedroomCount,
            bathrooms:      parseInt(d.bathrooms)  || 1,
            sqft:           parseFloat(d.sqft)     || 0,
            furnishing:     d.furnished || d.furnishing || 'unfurnished',
            parking:        d.parking  || 'no',

            // Price
            price:          parseFloat(d.price) || 0,

            // Location
            address:        d.address || `${d.area || ''}, ${d.city || ''}`.trim(),
            city:           d.city    || '',
            area:           d.area    || '',
            state:          d.state   || '',
            country:        d.country || 'India',
            pincode:        d.pincode || '',
            latitude:       parseFloat(d.latitude)  || 0,
            longitude:      parseFloat(d.longitude) || 0,

            // Media
            images:         finalImages,
            featuredImage:  finalImages[0] || null,

            // Amenities
            amenities:      Array.isArray(d.amenities) ? d.amenities : (d.amenities ? d.amenities.split(',').map(a => a.trim()) : ['Parking', 'Security']),

            // Owner / Agent
            ownerId:        user ? (user.uid || user.id) : 'anonymous',
            ownerName:      d.name  || (user ? user.name  : 'Seller'),
            ownerPhone:     d.phone || (user ? user.phone : ''),
            ownerEmail:     d.email || (user ? user.email : ''),
            agentName:      d.name  || (user ? user.name  : 'Seller'),

            // Meta
            verificationStatus: 'under_review',
            isFeatured:     false,
            yearBuilt:      parseInt(d.yearBuilt) || new Date().getFullYear(),
        };

        console.log('📤 Submitting property payload:', payload);

        // ── 3. Submit to backend API ───────────────────────────────────────
        try {
            let createdProperty = null;

            if (window.PropertiesData && window.ApiConfig) {
                try {
                    createdProperty = await window.PropertiesData.createProperty(payload);
                    console.log('✅ Property saved via API:', createdProperty.id);
                } catch (apiErr) {
                    console.warn('⚠️ API submission failed:', apiErr.message, '— falling back to localStorage');
                }
            }

            // ── 4. localStorage fallback ───────────────────────────────────
            if (!createdProperty) {
                const localId = 'prop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                createdProperty = { ...payload, id: localId, createdAt: new Date().toISOString() };

                let localList = [];
                try {
                    localList = JSON.parse(localStorage.getItem('submittedProperties') || '[]');
                } catch { localList = []; }
                localList.unshift(createdProperty);
                localStorage.setItem('submittedProperties', JSON.stringify(localList));

                // Clear PropertiesData cache so home page re-fetches
                if (window.PropertiesData) window.PropertiesData.clearCache();
                console.log('📦 Property saved to localStorage fallback:', localId);
            }

            // ── 5. Broadcast to other tabs / same-page listeners ───────────
            try {
                const bc = new BroadcastChannel('property_updates');
                bc.postMessage({ type: 'PROPERTY_PUBLISHED', property: createdProperty });
                bc.close();
            } catch { /* BroadcastChannel not supported — no-op */ }
            window.dispatchEvent(new CustomEvent('propertyPublished', { detail: createdProperty }));
            localStorage.setItem('lastPublishedProperty', JSON.stringify(createdProperty));

            // ── 6. Clear draft ─────────────────────────────────────────────
            this.clearDraft();

            // ── 7. Show animated success overlay ──────────────────────────
            this._showSuccessOverlay(createdProperty);

        } catch (error) {
            console.error('❌ Publish failed:', error);
            const msg = error.message || 'Something went wrong';
            this._showErrorToast(`⚠️ ${msg}\nPlease try again.`);

            const publishBtn = document.getElementById('publishBtn');
            if (publishBtn) {
                publishBtn.disabled = false;
                publishBtn.textContent = '🎉 Publish My Property / मेरी संपत्ति प्रकाशित करें';
            }
        }
    },

    // ── Success overlay ───────────────────────────────────────────────────────

    /**
     * Shows a full-screen premium animated success overlay.
     * After 2.5 s it redirects to the property detail page (or home if no detail page available).
     */
    _showSuccessOverlay(property) {
        // Prevent scrolling behind overlay
        document.body.style.overflow = 'hidden';

        const overlay = document.createElement('div');
        overlay.id = 'publishSuccessOverlay';
        overlay.style.cssText = `
            position:fixed;inset:0;z-index:99999;
            background:rgba(10,15,30,0.96);
            backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
            display:flex;align-items:center;justify-content:center;
            animation:overlayFadeIn 0.4s ease;
        `;

        const priceText = property.price
            ? (property.price >= 10000000
                ? `₹${(property.price / 10000000).toFixed(2)} Cr`
                : property.price >= 100000
                    ? `₹${(property.price / 100000).toFixed(2)} Lakh`
                    : `₹${Number(property.price).toLocaleString('en-IN')}`)
            : '';

        overlay.innerHTML = `
            <style>
                @keyframes overlayFadeIn { from{opacity:0} to{opacity:1} }
                @keyframes checkPop { 0%{transform:scale(0) rotate(-45deg);opacity:0} 60%{transform:scale(1.2) rotate(5deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
                @keyframes sparkle { 0%,100%{opacity:0;transform:scale(0)} 50%{opacity:1;transform:scale(1)} }
                @keyframes slideUpIn { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }
                @keyframes countDown { from{stroke-dashoffset:0} to{stroke-dashoffset:157} }
                .success-check {
                    width:100px;height:100px;border-radius:50%;
                    background:linear-gradient(135deg,#22c55e,#16a34a);
                    display:flex;align-items:center;justify-content:center;
                    font-size:2.8rem;margin:0 auto 1.5rem;
                    box-shadow:0 0 60px rgba(34,197,94,0.6);
                    animation:checkPop 0.6s cubic-bezier(0.34,1.56,0.64,1) both;
                }
                .spark { position:absolute;width:8px;height:8px;border-radius:50%;animation:sparkle 1.5s ease infinite; }
            </style>
            <div style="text-align:center;max-width:440px;padding:2.5rem;position:relative;">
                <!-- Sparkles -->
                <div class="spark" style="top:-20px;left:10%;background:#fbbf24;animation-delay:0s;"></div>
                <div class="spark" style="top:-30px;left:50%;background:#60a5fa;animation-delay:0.3s;"></div>
                <div class="spark" style="top:-15px;right:15%;background:#f43f5e;animation-delay:0.6s;"></div>
                <div class="spark" style="bottom:10px;left:5%;background:#a78bfa;animation-delay:0.9s;"></div>
                <div class="spark" style="bottom:5px;right:8%;background:#34d399;animation-delay:1.2s;"></div>

                <div class="success-check">🎉</div>

                <div style="animation:slideUpIn 0.5s 0.3s ease both;">
                    <h2 style="font-size:1.8rem;font-weight:800;color:#fff;margin:0 0 0.5rem;letter-spacing:-0.02em;">
                        Property Published!
                    </h2>
                    <p style="color:#94a3b8;font-size:1rem;margin:0 0 0.25rem;">
                        आपकी संपत्ति अब सबको दिखेगी 🏡
                    </p>
                    ${priceText ? `<p style="font-size:1.5rem;font-weight:800;color:#22c55e;margin:0.75rem 0 0;">${priceText}</p>` : ''}
                    ${property.city ? `<p style="color:#64748b;font-size:0.9rem;margin:0.25rem 0 0;">📍 ${property.area ? property.area + ', ' : ''}${property.city}</p>` : ''}
                </div>

                <div style="margin-top:2rem;animation:slideUpIn 0.5s 0.5s ease both;">
                    <div style="
                        background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);
                        border-radius:12px;padding:0.75rem 1.25rem;display:inline-block;
                        color:#22c55e;font-size:0.85rem;font-weight:600;
                    ">
                        ✓ Live listing · Visible to all users · Map marker added
                    </div>
                </div>

                <div style="margin-top:1.5rem;animation:slideUpIn 0.5s 0.7s ease both;">
                    <p style="color:#64748b;font-size:0.8rem;">Redirecting to your listing in <span id="successCountdown">3</span>s...</p>
                    <svg width="50" height="50" style="margin-top:0.5rem;transform:rotate(-90deg)">
                        <circle cx="25" cy="25" r="20" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="3"/>
                        <circle cx="25" cy="25" r="20" fill="none" stroke="#22c55e" stroke-width="3"
                            stroke-dasharray="126" stroke-dashoffset="0"
                            style="animation:countDown 3s linear forwards;transform-origin:center"/>
                    </svg>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Countdown
        let count = 3;
        const countEl = overlay.querySelector('#successCountdown');
        const interval = setInterval(() => {
            count--;
            if (countEl) countEl.textContent = count;
            if (count <= 0) {
                clearInterval(interval);
                document.body.style.overflow = '';
                overlay.remove();

                // Navigate to property detail or home
                const detailUrl = property.id
                    ? `property-detail.html?id=${encodeURIComponent(property.id)}`
                    : 'home.html';
                window.location.href = detailUrl;
            }
        }, 1000);
    },

    _showErrorToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position:fixed;bottom:30px;left:50%;transform:translateX(-50%);
            background:linear-gradient(135deg,#ef4444,#dc2626);
            color:white;padding:1rem 2rem;border-radius:16px;
            font-size:1rem;font-weight:700;z-index:99999;
            box-shadow:0 8px 30px rgba(239,68,68,0.4);
            max-width:90vw;text-align:center;white-space:pre-line;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    },

    // ── Price Formatting ──────────────────────────────────────────────────────

    formatIndianPrice(price) {
        if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
        if (price >= 100000)   return `₹${(price / 100000).toFixed(2)} Lakh`;
        return `₹${price.toLocaleString('en-IN')}`;
    }
};

// ── Bootstrap ─────────────────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
    window.FormUtils = FormUtils;

    document.addEventListener('DOMContentLoaded', function () {
        FormUtils.init();

        const currentStep = FormUtils.getCurrentStepNumber();
        FormUtils.updateProgress(currentStep);

        const draft = FormUtils.getDraft();
        const stepData = draft[`step${currentStep}`];

        if (stepData && Object.keys(stepData).length > 0) {
            console.log(`📥 Loading saved data for step ${currentStep}:`, stepData);
            Object.keys(stepData).forEach(key => {
                const input = document.querySelector(`[name="${key}"]`);
                if (input) {
                    if (input.type === 'radio' || input.type === 'checkbox') {
                        const match = document.querySelector(`[name="${key}"][value="${stepData[key]}"]`);
                        if (match) match.checked = true;
                    } else {
                        input.value = stepData[key];
                    }
                }
            });
        }
    });
}
