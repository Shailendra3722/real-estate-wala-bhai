/**
 * ==========================================
 * REAL ESTATE WALA BHAI - MOCK API CLIENT
 * ==========================================
 * 
 * Client-side mock API for simulating backend interactions
 * Provides realistic async behavior without requiring a server
 */

const MockAPI = (function () {
    'use strict';

    /**
     * Simulate network delay
     */
    function simulateDelay(min = 500, max = 1200) {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * Submit contact form
     */
    async function submitContact(data) {
        const { propertyId, name, phone, email, message } = data;

        // Validate required fields
        if (!propertyId || !name || !phone) {
            return {
                success: false,
                error: 'Missing required fields'
            };
        }

        // Simulate API delay
        await simulateDelay(800, 1500);

        // Get property details
        const property = PropertiesData.getPropertyById(propertyId);

        if (!property) {
            return {
                success: false,
                error: 'Property not found'
            };
        }

        // Store inquiry in localStorage
        const inquiries = JSON.parse(localStorage.getItem('inquiries') || '[]');
        const inquiry = {
            id: `INQ_${Date.now()}`,
            propertyId,
            propertyTitle: property.title,
            agentName: property.agentName || 'Property Agent',
            agentPhone: property.ownerPhone || property.phone || 'Not available',
            buyer: { name, phone, email },
            message: message || `Contact request from ${name}`,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        inquiries.push(inquiry);
        localStorage.setItem('inquiries', JSON.stringify(inquiries));

        // Return success
        return {
            success: true,
            inquiryId: inquiry.id,
            message: 'Your message has been sent to the agent successfully!',
            agentName: property.agentName || 'Property Agent',
            agentPhone: property.ownerPhone || property.phone || 'Not available'
        };
    }

    /**
     * Verify Aadhaar (simulated)
     */
    async function verifyAadhaar(aadhaarNumber) {
        // Validate format (12 digits)
        if (!aadhaarNumber || aadhaarNumber.length !== 12 || !/^\d{12}$/.test(aadhaarNumber)) {
            return {
                success: false,
                error: 'Invalid Aadhaar number format'
            };
        }

        // Simulate API delay
        await simulateDelay(800, 1200);

        // Mock verification (last digit even = verified)
        const isVerified = parseInt(aadhaarNumber[11]) % 2 === 0;

        if (isVerified) {
            return {
                success: true,
                verified: true,
                message: 'Aadhaar verified successfully',
                name: 'User Name', // Mock name
                verificationId: `VERIFY_${Date.now()}`
            };
        } else {
            return {
                success: false,
                verified: false,
                error: 'Unable to verify Aadhaar. Please check the number and try again.'
            };
        }
    }

    /**
     * Add new property (simulated)
     */
    async function addProperty(propertyData) {
        // Simulate API delay
        await simulateDelay(1000, 2000);

        // Create new property ID
        const propertyId = `prop_${Date.now()}`;

        // Add to properties data
        const newProperty = {
            ...propertyData,
            id: propertyId,
            featured: false,
            verificationStatus: 'pending',
            createdAt: new Date().toISOString()
        };

        // Store in localStorage
        const customProperties = JSON.parse(localStorage.getItem('customProperties') || '[]');
        customProperties.push(newProperty);
        localStorage.setItem('customProperties', JSON.stringify(customProperties));

        return {
            success: true,
            propertyId,
            message: 'Property submitted successfully! It is under review.',
            property: newProperty
        };
    }

    /**
     * Get user inquiries
     */
    function getInquiries(userPhone) {
        const inquiries = JSON.parse(localStorage.getItem('inquiries') || '[]');
        return inquiries.filter(inq => inq.buyer.phone === userPhone);
    }

    // Public API
    return {
        submitContact,
        verifyAadhaar,
        addProperty,
        getInquiries
    };
})();

// Make globally available
window.MockAPI = MockAPI;

console.log('✅ Mock API client loaded');
