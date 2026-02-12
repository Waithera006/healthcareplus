// Custom Cursor
const cursor = document.getElementById('cursor');
const cursorTrail = document.getElementById('cursor-trail');

document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    
    setTimeout(() => {
        cursorTrail.style.left = e.clientX + 'px';
        cursorTrail.style.top = e.clientY + 'px';
    }, 100);
});

document.querySelectorAll('button, a, .service-item, .card').forEach(el => {
    el.addEventListener('mouseenter', () => {
        cursor.style.transform = 'scale(1.5)';
        cursor.style.borderColor = '#4CAF50';
    });
    el.addEventListener('mouseleave', () => {
        cursor.style.transform = 'scale(1)';
        cursor.style.borderColor = '#0D6986';
    });
});

// Modal Functions
function openModal() {
    document.getElementById('bookingModal').classList.add('active');
}

function closeModal() {
    document.getElementById('bookingModal').classList.remove('active');
}

// Backend API Configuration
const API_BASE_URL = window.location.origin === 'null' || 
                     window.location.protocol === 'file:' 
                     ? 'http://localhost:5000' 
                     : window.location.origin;

// Log for debugging
console.log('Frontend loaded from:', window.location.href);
console.log('API Base URL:', API_BASE_URL);

// ==================== SERVER CONNECTION CHECK ====================
async function waitForServer(maxAttempts = 10, interval = 1000) {
    console.log('Waiting for server to be ready...');
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/test-cors`, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache'
            });
            
            if (response.ok) {
                console.log(`✓ Server ready after ${attempt} attempt(s)`);
                return true;
            }
        } catch (error) {
            console.log(`Attempt ${attempt}: Server not ready yet...`);
            if (attempt === maxAttempts) {
                console.warn('Server might not be running. Please start the backend server.');
                return false;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
    }
    return false;
}

// ==================== AUTHENTICATION FUNCTIONS ====================
async function login(email, password) {
    try {
        console.log('Attempting login for:', email);
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        console.log('Login response status:', response.status);
        const data = await response.json();
        console.log('Login response data:', data);
        
        if (data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userEmail', data.user.email);
            localStorage.setItem('userName', data.user.name);
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('userRole', data.user.role);
            localStorage.setItem('userCreatedAt', data.user.createdAt || new Date().toISOString());
            localStorage.setItem('userLastLogin', new Date().toISOString());
            
            // Show success message
            alert(`Welcome back, ${data.user.name}!`);
            return true;
        } else {
            alert(data.message || 'Login failed. Please try again.');
            return false;
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please check if the server is running.');
        return false;
    }
}

async function register(name, email, phone, password) {
    try {
        console.log('Attempting registration:', { name, email, phone });
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, phone, password })
        });
        
        console.log('Registration response status:', response.status);
        const data = await response.json();
        console.log('Registration response data:', data);
        
        if (data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userEmail', data.user.email);
            localStorage.setItem('userName', data.user.name);
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('userRole', data.user.role);
            localStorage.setItem('userCreatedAt', new Date().toISOString());
            localStorage.setItem('userLastLogin', new Date().toISOString());
            
            alert(`Welcome, ${data.user.name}! Your account has been created.`);
            return true;
        } else {
            alert(data.message || 'Registration failed. Please try again.');
            return false;
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please check if the server is running.');
        return false;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userCreatedAt');
    localStorage.removeItem('userLastLogin');
    location.reload();
}

// ==================== HEALTH TIPS ====================
async function initializeHealthTip() {
    try {
        console.log('Fetching health tip from:', `${API_BASE_URL}/api/healthtips/random`);
        const response = await fetch(`${API_BASE_URL}/api/healthtips/random`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Health tip response:', data);
        
        if (data.success) {
            document.getElementById('healthTip').textContent = `"${data.tip.content}"`;
            document.getElementById('healthTip').setAttribute('data-tip-id', data.tip.id);
        } else {
            throw new Error('Failed to get health tip from server');
        }
    } catch (error) {
        console.error('Failed to fetch health tip:', error);
        // Fallback to local tips
        const healthTips = [
            "An apple a day keeps the doctor away - they're packed with fiber and antioxidants!",
            "Bananas are rich in potassium, vital for heart health and muscle function.",
            "Drinking 8 glasses of water daily helps maintain proper body function.",
            "Regular exercise for 30 minutes a day can reduce the risk of chronic diseases.",
            "Getting 7-9 hours of sleep each night is essential for physical and mental health.",
            "Washing your hands properly can prevent the spread of many infections.",
            "Eating a rainbow of fruits and vegetables ensures diverse nutrient intake.",
            "Regular health checkups can detect problems before they become serious.",
            "Reducing stress through meditation can improve overall wellbeing.",
            "Maintaining social connections is important for mental and emotional health."
        ];
        const randomTip = healthTips[Math.floor(Math.random() * healthTips.length)];
        document.getElementById('healthTip').textContent = `"${randomTip}"`;
    }
}

// ==================== APPOINTMENT FUNCTIONS - FIXED VERSION ====================
async function handleSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const department = document.getElementById('department').value;
    const message = document.getElementById('message').value;
    
    // Get user info if logged in
    const token = localStorage.getItem('token');
    const patientEmail = localStorage.getItem('userEmail');
    
    let email;
    if (patientEmail) {
        email = patientEmail;
    } else {
        email = prompt('Please enter your email address for confirmation:');
        if (!email) {
            alert('Email is required for appointment booking.');
            return;
        }
    }
    
    const appointmentData = {
        patientName: name,
        patientEmail: email,
        patientPhone: phone,
        department: department,
        message: message || ''
    };
    
    console.log('Submitting appointment:', appointmentData);
    
    try {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Add authorization header if logged in
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_BASE_URL}/api/appointments`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(appointmentData)
        });
        
        console.log('Appointment response status:', response.status);
        
        // Try to parse the response as JSON
        let data;
        try {
            data = await response.json();
            console.log('Appointment response data:', data);
        } catch (e) {
            console.error('Failed to parse JSON response:', e);
            throw new Error('Invalid response from server');
        }
        
        // Check if the response was successful (status 200-299)
        if (!response.ok) {
            throw new Error(data.message || `Server error: ${response.status}`);
        }
        
        // Check for success in various possible response formats
        if (data.success === true || data.appointment || data.id) {
            // Appointment was successfully created
            const reference = data.appointment?.reference || data.reference || `APPT${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
            const department_name = data.appointment?.department || department;
            const status = data.appointment?.status || 'pending';
            
            // Show success message with appointment details
            const successHTML = `
                <div class="appointment-success">
                    <h3>✓ Appointment Request Submitted!</h3>
                    <p><strong>Reference:</strong> ${reference}</p>
                    <p><strong>Department:</strong> ${department_name}</p>
                    <p><strong>Status:</strong> <span class="status-badge pending">${status}</span></p>
                    <p>We will contact you shortly at <strong>${email}</strong> to confirm your appointment.</p>
                    <button class="btn-primary" onclick="closeSuccessMessage()" style="margin-top: 15px;">OK</button>
                </div>
            `;
            
            // Add styles if not already added
            if (!document.getElementById('appointment-success-styles')) {
                const style = document.createElement('style');
                style.id = 'appointment-success-styles';
                style.textContent = `
                    .appointment-success {
                        text-align: center;
                        padding: 20px;
                        background: linear-gradient(135deg, #f8fff8, #f0f9f0);
                        border-radius: 8px;
                        border-left: 4px solid #4CAF50;
                    }
                    .appointment-success h3 {
                        color: #4CAF50;
                        margin-bottom: 15px;
                    }
                    .appointment-success p {
                        margin: 10px 0;
                    }
                `;
                document.head.appendChild(style);
            }
            
            // Replace the form with success message
            const form = document.querySelector('.modal-content form');
            if (form) {
                form.innerHTML = successHTML;
            } else {
                alert(`✅ Appointment booked successfully! Reference: ${reference}`);
                closeModal();
            }
            
            // Auto close after 5 seconds
            setTimeout(() => {
                closeModal();
                location.reload();
            }, 5000);
        } else {
            throw new Error(data.message || 'Failed to submit appointment');
        }
    } catch (error) {
        console.error('Error submitting appointment:', error);
        
        // Check if appointment was actually created despite error
        const shouldRefresh = confirm('⚠️ There was an issue, but your appointment may have been created. Would you like to refresh to check?');
        if (shouldRefresh) {
            location.reload();
        } else {
            alert('Failed to submit appointment: ' + error.message);
        }
    }
}

function closeSuccessMessage() {
    closeModal();
    location.reload();
}

// ==================== APPOINTMENT MANAGEMENT ====================
async function viewMyAppointments() {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    if (!token) {
        alert('Please sign in to view appointments.');
        showLoginModal();
        return;
    }
    
    try {
        console.log('Fetching appointments...');
        
        // Admin sees all appointments, users see their own
        const endpoint = userRole === 'admin' ? '/api/appointments' : '/api/appointments/my';
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Appointments response status:', response.status);
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token expired
                localStorage.removeItem('token');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userName');
                localStorage.removeItem('userId');
                localStorage.removeItem('userRole');
                alert('Your session has expired. Please login again.');
                showLoginModal();
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Appointments response data:', data);
        
        if (data.success) {
            showAppointmentsModal(data.appointments || []);
        } else {
            alert(data.message || 'Failed to load appointments.');
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
        
        // Try fallback endpoint
        if (userRole !== 'admin') {
            try {
                console.log('Trying fallback endpoint...');
                const fallbackResponse = await fetch(`${API_BASE_URL}/api/appointments`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (fallbackResponse.ok) {
                    const fallbackData = await fallbackResponse.json();
                    if (fallbackData.success) {
                        showAppointmentsModal(fallbackData.appointments);
                        return;
                    }
                }
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
            }
        }
        
        alert('Failed to load appointments. Please try again later.');
    }
}

function showAppointmentsModal(appointments) {
    const userRole = localStorage.getItem('userRole') || 'patient';
    const isAdmin = userRole === 'admin';
    const userName = localStorage.getItem('userName') || 'User';
    
    let appointmentsHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #0D6986;">
                ${isAdmin ? '📋 All Appointments' : '📅 My Appointments'}
            </h3>
            <span style="background: #e9ecef; padding: 5px 15px; border-radius: 20px; font-size: 0.9rem;">
                ${isAdmin ? 'Admin View' : userName}
            </span>
        </div>
    `;
    
    if (!appointments || appointments.length === 0) {
        appointmentsHTML += `
            <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                <p style="font-size: 1.1rem; margin-bottom: 20px;">📭 No appointments found.</p>
                ${!isAdmin ? `
                    <button onclick="openModal(); closeModalById('appointmentsModal');" class="btn-primary">
                        Book an Appointment
                    </button>
                ` : ''}
            </div>
        `;
    } else {
        appointmentsHTML += `
            <div style="margin-bottom: 15px; color: #6c757d; font-size: 0.9rem; display: flex; justify-content: space-between;">
                <span>Showing ${appointments.length} appointment${appointments.length !== 1 ? 's' : ''}</span>
                ${isAdmin ? `<span>👥 Total Patients: ${new Set(appointments.map(a => a.patientEmail)).size}</span>` : ''}
            </div>
            <div class="appointments-list">
        `;
        
        appointments.forEach((appt, index) => {
            const date = appt.createdAt ? new Date(appt.createdAt).toLocaleDateString() : 'N/A';
            const time = appt.createdAt ? new Date(appt.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
            
            appointmentsHTML += `
                <div class="appointment-item" style="animation: slideIn 0.3s ease ${index * 0.05}s both;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <strong style="font-size: 1.1rem; color: #0D6986;">
                                ${appt.department ? appt.department.charAt(0).toUpperCase() + appt.department.slice(1) : 'General'}
                            </strong>
                            <span class="status-badge ${appt.status}">${appt.status || 'pending'}</span>
                        </div>
                        ${isAdmin ? `
                            <div class="admin-actions">
                                <select onchange="updateAppointmentStatus('${appt.id}', this.value)" class="status-select">
                                    <option value="pending" ${appt.status === 'pending' ? 'selected' : ''}>Pending</option>
                                    <option value="confirmed" ${appt.status === 'confirmed' ? 'selected' : ''}>Confirm</option>
                                    <option value="completed" ${appt.status === 'completed' ? 'selected' : ''}>Complete</option>
                                    <option value="cancelled" ${appt.status === 'cancelled' ? 'selected' : ''}>Cancel</option>
                                </select>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div style="margin-top: 10px;">
                        <p><strong>Patient:</strong> ${appt.patientName}</p>
                        ${isAdmin ? `<p><strong>Email:</strong> ${appt.patientEmail}</p>` : ''}
                        <p><strong>Phone:</strong> ${appt.patientPhone || 'N/A'}</p>
                        <p><small>📅 Booked: ${date} at ${time}</small></p>
                        ${appt.message ? `<p style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px;"><strong>Message:</strong> ${appt.message}</p>` : ''}
                        ${appt.notes ? `<p style="margin-top: 5px; color: #6c757d; font-style: italic;">📝 Notes: ${appt.notes}</p>` : ''}
                    </div>
                    
                    ${!isAdmin && appt.status === 'pending' ? `
                        <div style="margin-top: 15px; text-align: right;">
                            <button onclick="cancelAppointment('${appt.id}')" class="btn-small btn-danger">
                                ❌ Cancel Appointment
                            </button>
                        </div>
                    ` : ''}
                    
                    ${appt.status === 'cancelled' ? `
                        <div style="margin-top: 10px; padding: 8px; background: #f8d7da; color: #721c24; border-radius: 5px; font-size: 0.9rem;">
                            ❌ This appointment has been cancelled.
                            ${appt.cancelledByName ? `<br>Cancelled by: ${appt.cancelledByName}` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        });
        appointmentsHTML += '</div>';
        
        // Admin actions
        if (isAdmin && appointments.length > 0) {
            appointmentsHTML += `
                <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #e9ecef;">
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button onclick="viewStatistics()" class="btn-secondary">
                            📊 View Statistics
                        </button>
                        <button onclick="exportAppointments()" class="btn-secondary">
                            📥 Export CSV
                        </button>
                        <button onclick="refreshAppointments()" class="btn-secondary">
                            🔄 Refresh
                        </button>
                    </div>
                </div>
            `;
        }
    }
    
    const modalHTML = `
        <div class="modal active" id="appointmentsModal">
            <div class="modal-content" style="max-width: 800px;">
                <span class="close-modal" onclick="closeModalById('appointmentsModal')">&times;</span>
                ${appointmentsHTML}
            </div>
        </div>
    `;
    
    // Add styles if not already added
    if (!document.getElementById('appointments-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'appointments-modal-styles';
        style.textContent = `
            .appointments-list {
                max-height: 500px;
                overflow-y: auto;
                padding-right: 5px;
            }
            .appointment-item {
                background: white;
                padding: 20px;
                margin-bottom: 15px;
                border-radius: 10px;
                border-left: 4px solid #0D6986;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                transition: transform 0.2s, box-shadow 0.2s;
            }
            .appointment-item:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            .status-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: bold;
                margin-left: 10px;
                text-transform: uppercase;
            }
            .status-badge.pending {
                background: #fff3cd;
                color: #856404;
                border: 1px solid #ffeaa7;
            }
            .status-badge.confirmed {
                background: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }
            .status-badge.cancelled {
                background: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }
            .status-badge.completed {
                background: #d1ecf1;
                color: #0c5460;
                border: 1px solid #bee5eb;
            }
            .btn-small {
                padding: 5px 12px;
                font-size: 0.85rem;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                background: #0D6986;
                color: white;
                transition: all 0.2s;
            }
            .btn-small:hover {
                background: #50A2B3;
                transform: translateY(-1px);
            }
            .btn-danger {
                background: #dc3545;
            }
            .btn-danger:hover {
                background: #c82333;
            }
            .status-select {
                padding: 5px 10px;
                border-radius: 5px;
                border: 1px solid #ced4da;
                font-size: 0.85rem;
                background: white;
                cursor: pointer;
            }
            .status-select:hover {
                border-color: #0D6986;
            }
            .admin-actions {
                display: flex;
                gap: 8px;
            }
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Remove existing modal if any
    const existingModal = document.getElementById('appointmentsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// ==================== ADMIN FUNCTIONS - FIXED VERSION ====================
async function updateAppointmentStatus(appointmentId, newStatus) {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    if (!token) {
        alert('Please login first.');
        showLoginModal();
        return;
    }
    
    if (userRole !== 'admin') {
        alert('Only administrators can update appointment status.');
        return;
    }
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(newStatus.toLowerCase())) {
        alert('Invalid status. Must be: pending, confirmed, cancelled, or completed');
        return;
    }
    
    // Optional notes
    const notes = prompt('Add notes (optional):', `Status updated to ${newStatus}`);
    
    try {
        console.log(`Updating appointment ${appointmentId} to ${newStatus}...`);
        
        const response = await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                status: newStatus.toLowerCase(),
                notes: notes || `Status updated to ${newStatus} by ${localStorage.getItem('userName') || 'Admin'}`
            })
        });
        
        console.log('Status update response status:', response.status);
        
        // Try to parse response
        let data;
        try {
            data = await response.json();
            console.log('Status update response data:', data);
        } catch (e) {
            console.error('Failed to parse JSON response:', e);
            throw new Error('Invalid response from server');
        }
        
        if (!response.ok) {
            throw new Error(data.message || `Server error: ${response.status}`);
        }
        
        if (data.success) {
            alert(`✅ Appointment status updated to ${newStatus}!`);
            closeModalById('appointmentsModal');
            viewMyAppointments(); // Refresh the list
        } else {
            alert('Failed to update: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error updating appointment:', error);
        alert('Failed to update appointment status: ' + error.message);
    }
}

async function cancelAppointment(appointmentId) {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    if (!token) {
        alert('Please login first.');
        showLoginModal();
        return;
    }
    
    if (!confirm('Are you sure you want to cancel this appointment?')) {
        return;
    }
    
    const reason = prompt('Please provide a reason for cancellation (optional):');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}/cancel`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                reason: reason || 'Cancelled by patient',
                cancelledBy: userRole
            })
        });
        
        let data;
        try {
            data = await response.json();
        } catch (e) {
            console.error('Failed to parse JSON response:', e);
            throw new Error('Invalid response from server');
        }
        
        if (!response.ok) {
            throw new Error(data.message || `Server error: ${response.status}`);
        }
        
        if (data.success) {
            alert('✅ Appointment cancelled successfully!');
            closeModalById('appointmentsModal');
            viewMyAppointments(); // Refresh the list
        } else {
            alert('Failed to cancel: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        alert('Failed to cancel appointment: ' + error.message);
    }
}

function refreshAppointments() {
    closeModalById('appointmentsModal');
    viewMyAppointments();
}

function exportAppointments() {
    const appointments = document.querySelectorAll('.appointment-item');
    if (!appointments.length) {
        alert('No appointments to export.');
        return;
    }
    
    alert('📥 Export feature: In production, this would download a CSV file with all appointment data.');
    console.log('Export appointments functionality would be implemented here');
}

async function viewStatistics() {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    if (!token || userRole !== 'admin') {
        alert('Admin access required to view statistics.');
        return;
    }
    
    try {
        console.log('Fetching statistics...');
        const response = await fetch(`${API_BASE_URL}/api/appointments/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Statistics data:', data);
        
        if (data.success) {
            showStatisticsModal(data.stats);
        } else {
            alert(data.message || 'Failed to load statistics');
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
        alert('Failed to load statistics. Please try again.');
    }
}

function showStatisticsModal(stats) {
    let statsHTML = `
        <h3 style="color: #0D6986; margin-bottom: 20px;">📊 Appointment Statistics</h3>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #0D6986, #50A2B3); padding: 20px; border-radius: 10px; color: white;">
                <h4 style="margin: 0; opacity: 0.9;">Total Appointments</h4>
                <p style="font-size: 2.5rem; font-weight: bold; margin: 10px 0;">${stats.total?.appointments || 0}</p>
            </div>
            <div style="background: linear-gradient(135deg, #4CAF50, #81C784); padding: 20px; border-radius: 10px; color: white;">
                <h4 style="margin: 0; opacity: 0.9;">Total Patients</h4>
                <p style="font-size: 2.5rem; font-weight: bold; margin: 10px 0;">${stats.total?.patients || 0}</p>
            </div>
            <div style="background: linear-gradient(135deg, #FF9800, #FFB74D); padding: 20px; border-radius: 10px; color: white;">
                <h4 style="margin: 0; opacity: 0.9;">Today's Appointments</h4>
                <p style="font-size: 2.5rem; font-weight: bold; margin: 10px 0;">${stats.today?.appointments || 0}</p>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
                <h4 style="color: #0D6986; margin-top: 0;">📌 Status Breakdown</h4>
                <ul style="list-style: none; padding: 0;">
                    ${Object.entries(stats.byStatus || {}).map(([status, count]) => `
                        <li style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                            <span style="text-transform: capitalize;">${status}</span>
                            <span style="font-weight: bold; color: #0D6986;">${count}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
                <h4 style="color: #0D6986; margin-top: 0;">🏥 Department Breakdown</h4>
                <ul style="list-style: none; padding: 0;">
                    ${Object.entries(stats.byDepartment || {}).map(([dept, count]) => `
                        <li style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                            <span style="text-transform: capitalize;">${dept}</span>
                            <span style="font-weight: bold; color: #0D6986;">${count}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>
        
        <div style="margin-top: 20px; text-align: right;">
            <button onclick="closeModalById('statsModal')" class="btn-secondary">Close</button>
            <button onclick="refreshAppointments(); closeModalById('statsModal');" class="btn-primary" style="margin-left: 10px;">
                View Appointments
            </button>
        </div>
    `;
    
    const modalHTML = `
        <div class="modal active" id="statsModal">
            <div class="modal-content" style="max-width: 700px;">
                <span class="close-modal" onclick="closeModalById('statsModal')">&times;</span>
                ${statsHTML}
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('statsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// ==================== PROFILE MANAGEMENT ====================
// Edit profile function - now with full functionality
async function editProfile() {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');
    const userId = localStorage.getItem('userId');
    const userCreatedAt = localStorage.getItem('userCreatedAt');
    
    if (!token) {
        alert('Please login first.');
        showLoginModal();
        return;
    }
    
    // Format date
    const joinDate = userCreatedAt ? new Date(userCreatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : 'N/A';
    
    // Create profile management modal
    const modalHTML = `
        <div class="modal active" id="profileModal">
            <div class="modal-content" style="max-width: 550px;">
                <span class="close-modal" onclick="closeModalById('profileModal')">&times;</span>
                <h2 style="color: #0D6986; text-align: center; margin-bottom: 20px;">
                    ${userRole === 'admin' ? '👑 Admin Profile' : '👤 My Profile'}
                </h2>
                
                <!-- Profile Tabs -->
                <div class="profile-tabs">
                    <button class="profile-tab-btn active" data-tab="info">📋 Profile Info</button>
                    <button class="profile-tab-btn" data-tab="password">🔐 Change Password</button>
                    ${userRole === 'admin' ? `
                        <button class="profile-tab-btn" data-tab="email">📧 Change Email</button>
                        <button class="profile-tab-btn" data-tab="security">🛡️ Security</button>
                    ` : ''}
                </div>
                
                <!-- Profile Info Tab -->
                <div id="profileInfoTab" class="profile-tab-content active">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="font-size: 4rem; margin-bottom: 10px; background: linear-gradient(135deg, #0D6986, #50A2B3); width: 100px; height: 100px; line-height: 100px; border-radius: 50%; margin: 0 auto 15px; color: white;">
                            ${userRole === 'admin' ? '👨‍⚕️' : '👤'}
                        </div>
                        <h3 style="margin: 5px 0; color: #212529; font-size: 1.5rem;">${userName}</h3>
                        <p style="color: #6c757d; margin: 5px 0;">${userEmail}</p>
                        <span style="display: inline-block; padding: 5px 15px; background: ${userRole === 'admin' ? '#4CAF50' : '#0D6986'}; color: white; border-radius: 20px; font-size: 0.8rem; margin-top: 5px;">
                            ${userRole === 'admin' ? '👑 Administrator' : 'Patient'}
                        </span>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; border-radius: 12px; margin-top: 20px;">
                        <h4 style="color: #0D6986; margin-top: 0; margin-bottom: 15px; display: flex; align-items: center;">
                            <span style="background: #0D6986; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 0.8rem;">✓</span>
                            Account Details
                        </h4>
                        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 10px; font-size: 0.95rem;">
                            <strong>User ID:</strong>
                            <span style="color: #6c757d; font-family: monospace;">${userId || 'N/A'}</span>
                            
                            <strong>Member Since:</strong>
                            <span style="color: #6c757d;">${joinDate}</span>
                            
                            <strong>Last Login:</strong>
                            <span style="color: #6c757d;">Today</span>
                            
                            <strong>Account Status:</strong>
                            <span style="color: #28a745;">Active ✓</span>
                        </div>
                    </div>
                    
                    <button onclick="closeModalById('profileModal')" class="btn-secondary" style="width: 100%; margin-top: 20px; padding: 12px;">Close</button>
                </div>
                
                <!-- Change Password Tab -->
                <div id="profilePasswordTab" class="profile-tab-content">
                    <h3 style="color: #0D6986; margin-bottom: 20px; display: flex; align-items: center;">
                        <span style="background: #0D6986; color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px;">🔐</span>
                        Change Password
                    </h3>
                    
                    <form id="changePasswordForm">
                        <div class="form-group">
                            <label for="currentPassword">Current Password</label>
                            <input type="password" id="currentPassword" class="profile-input" placeholder="Enter current password" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="newPassword">New Password</label>
                            <input type="password" id="newPassword" class="profile-input" placeholder="Enter new password" required minlength="6">
                            <small style="color: #6c757d; display: block; margin-top: 5px;">Minimum 6 characters with at least one number and one letter</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="confirmPassword">Confirm New Password</label>
                            <input type="password" id="confirmPassword" class="profile-input" placeholder="Confirm new password" required minlength="6">
                        </div>
                        
                        <div id="passwordStrength" style="margin-bottom: 20px; display: none;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span style="font-size: 0.9rem; color: #495057;">Password Strength:</span>
                                <span id="strengthText" style="font-weight: bold;">Weak</span>
                            </div>
                            <div style="height: 6px; background: #e9ecef; border-radius: 3px; overflow: hidden;">
                                <div id="strengthBar" style="height: 100%; width: 0%; transition: all 0.3s;"></div>
                            </div>
                        </div>
                        
                        <div style="background: #e8f4f8; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #0D6986;">
                            <strong style="color: #0D6986;">Password Requirements:</strong>
                            <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #495057;">
                                <li>At least 6 characters long</li>
                                <li>At least one uppercase letter</li>
                                <li>At least one number</li>
                                <li>At least one special character (!@#$%^&*)</li>
                            </ul>
                        </div>
                        
                        <button type="submit" class="btn-primary" style="width: 100%; padding: 12px;">Update Password</button>
                        <button type="button" onclick="switchProfileTab('info')" class="btn-secondary" style="width: 100%; margin-top: 10px; padding: 12px;">Cancel</button>
                    </form>
                </div>
                
                <!-- Change Email Tab (Admin Only) -->
                ${userRole === 'admin' ? `
                <div id="profileEmailTab" class="profile-tab-content">
                    <h3 style="color: #0D6986; margin-bottom: 20px; display: flex; align-items: center;">
                        <span style="background: #0D6986; color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px;">📧</span>
                        Change Email Address
                    </h3>
                    
                    <form id="changeEmailForm">
                        <div class="form-group">
                            <label for="currentEmail">Current Email</label>
                            <input type="email" id="currentEmail" class="profile-input" value="${userEmail}" readonly disabled style="background: #f8f9fa; border: 2px dashed #ced4da;">
                        </div>
                        
                        <div class="form-group">
                            <label for="newEmail">New Email Address</label>
                            <input type="email" id="newEmail" class="profile-input" placeholder="Enter new email address" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="confirmEmail">Confirm New Email</label>
                            <input type="email" id="confirmEmail" class="profile-input" placeholder="Confirm new email address" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="emailPassword">Confirm Password</label>
                            <input type="password" id="emailPassword" class="profile-input" placeholder="Enter your password to confirm" required>
                            <small style="color: #6c757d; display: block; margin-top: 5px;">Enter your current password to verify this change</small>
                        </div>
                        
                        <div style="background: #fff3cd; color: #856404; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
                            <strong>⚠️ Important:</strong> Changing your email will log you out immediately. You'll need to login again with your new email address.
                        </div>
                        
                        <button type="submit" class="btn-primary" style="width: 100%; padding: 12px;">Update Email</button>
                        <button type="button" onclick="switchProfileTab('info')" class="btn-secondary" style="width: 100%; margin-top: 10px; padding: 12px;">Cancel</button>
                    </form>
                </div>
                
                <!-- Security Tab (Admin Only) -->
                <div id="profileSecurityTab" class="profile-tab-content">
                    <h3 style="color: #0D6986; margin-bottom: 20px; display: flex; align-items: center;">
                        <span style="background: #0D6986; color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px;">🛡️</span>
                        Security Settings
                    </h3>
                    
                    <div style="background: linear-gradient(135deg, #f8f9fa, #ffffff); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #e9ecef;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h4 style="margin: 0; color: #212529; display: flex; align-items: center;">
                                    <span style="font-size: 1.5rem; margin-right: 10px;">🔐</span>
                                    Two-Factor Authentication
                                </h4>
                                <p style="color: #6c757d; margin: 8px 0 0 0; font-size: 0.9rem;">
                                    Add an extra layer of security to your account. When enabled, you'll need both your password and a verification code from your phone.
                                </p>
                            </div>
                            <button onclick="enable2FA()" class="btn-primary" style="padding: 10px 20px; white-space: nowrap;">
                                Enable 2FA
                            </button>
                        </div>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #f8f9fa, #ffffff); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #e9ecef;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h4 style="margin: 0; color: #212529; display: flex; align-items: center;">
                                    <span style="font-size: 1.5rem; margin-right: 10px;">📋</span>
                                    Login History
                                </h4>
                                <p style="color: #6c757d; margin: 8px 0 0 0; font-size: 0.9rem;">
                                    View all login attempts to your account, including successful and failed attempts.
                                </p>
                            </div>
                            <button onclick="viewLoginHistory()" class="btn-secondary" style="padding: 10px 20px;">
                                View History
                            </button>
                        </div>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #fff5f5, #ffffff); padding: 20px; border-radius: 12px; border: 1px solid #ffc9c9;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h4 style="margin: 0; color: #dc3545; display: flex; align-items: center;">
                                    <span style="font-size: 1.5rem; margin-right: 10px;">⚠️</span>
                                    Delete Account
                                </h4>
                                <p style="color: #6c757d; margin: 8px 0 0 0; font-size: 0.9rem;">
                                    Permanently delete your account and all associated data. This action cannot be undone.
                                </p>
                                <p style="color: #dc3545; margin: 8px 0 0 0; font-size: 0.85rem; font-weight: bold;">
                                    Note: Cannot delete the last admin account.
                                </p>
                            </div>
                            <button onclick="deleteAccount()" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                                Delete Account
                            </button>
                        </div>
                    </div>
                    
                    <button onclick="switchProfileTab('info')" class="btn-secondary" style="width: 100%; margin-top: 20px; padding: 12px;">
                        Back to Profile
                    </button>
                </div>
                ` : `
                <!-- Patient Security Tab (Simplified) -->
                <div id="profileSecurityTab" class="profile-tab-content">
                    <h3 style="color: #0D6986; margin-bottom: 20px;">🔐 Security</h3>
                    
                    <div style="background: #fff5f5; padding: 20px; border-radius: 12px; border: 1px solid #ffc9c9;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h4 style="margin: 0; color: #dc3545;">Delete Account</h4>
                                <p style="color: #6c757d; margin: 8px 0 0 0; font-size: 0.9rem;">
                                    Permanently delete your account and all appointment history.
                                </p>
                            </div>
                            <button onclick="deleteAccount()" style="padding: 8px 15px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
                `}
            </div>
        </div>
    `;
    
    // Add styles if not already added
    if (!document.getElementById('profile-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'profile-modal-styles';
        style.textContent = `
            .profile-tabs {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                margin-bottom: 25px;
                border-bottom: 2px solid #e9ecef;
                padding-bottom: 10px;
            }
            .profile-tab-btn {
                padding: 12px 15px;
                background: none;
                border: none;
                font-size: 0.95rem;
                color: #6c757d;
                cursor: pointer;
                transition: all 0.3s;
                border-radius: 8px;
                flex: 1 1 auto;
                font-weight: 500;
            }
            .profile-tab-btn.active {
                background: #0D6986;
                color: white;
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(13,105,134,0.2);
            }
            .profile-tab-btn:hover {
                background: #e9ecef;
            }
            .profile-tab-btn.active:hover {
                background: #0D6986;
            }
            .profile-tab-content {
                display: none;
                animation: fadeIn 0.3s ease;
            }
            .profile-tab-content.active {
                display: block;
            }
            .profile-input {
                width: 100%;
                padding: 12px;
                border: 2px solid #e9ecef;
                border-radius: 8px;
                font-size: 1rem;
                transition: border-color 0.3s;
            }
            .profile-input:focus {
                border-color: #0D6986;
                outline: none;
                box-shadow: 0 0 0 3px rgba(13,105,134,0.1);
            }
            .profile-input:disabled {
                background: #f8f9fa;
                color: #6c757d;
            }
            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Remove existing modal and add new one
    closeModalById('profileModal');
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Setup tab switching
    document.querySelectorAll('.profile-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchProfileTab(tabName);
        });
    });
    
    // Password strength checker
    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function() {
            checkPasswordStrength(this.value);
        });
    }
    
    // Handle password change form
    const passwordForm = document.getElementById('changePasswordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await changePassword();
        });
    }
    
    // Handle email change form (admin only)
    const emailForm = document.getElementById('changeEmailForm');
    if (emailForm) {
        emailForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await changeEmail();
        });
    }
}

// Switch profile tabs
function switchProfileTab(tabName) {
    // Remove active class from all tabs and contents
    document.querySelectorAll('.profile-tab-btn').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.profile-tab-content').forEach(c => c.classList.remove('active'));
    
    // Add active class to selected tab
    const selectedTab = document.querySelector(`.profile-tab-btn[data-tab="${tabName}"]`);
    if (selectedTab) selectedTab.classList.add('active');
    
    // Show selected content
    let contentId = '';
    switch(tabName) {
        case 'info': contentId = 'profileInfoTab'; break;
        case 'password': contentId = 'profilePasswordTab'; break;
        case 'email': contentId = 'profileEmailTab'; break;
        case 'security': contentId = 'profileSecurityTab'; break;
    }
    
    const content = document.getElementById(contentId);
    if (content) content.classList.add('active');
}

// Check password strength
function checkPasswordStrength(password) {
    const strengthDiv = document.getElementById('passwordStrength');
    const strengthText = document.getElementById('strengthText');
    const strengthBar = document.getElementById('strengthBar');
    
    if (!strengthDiv || !strengthText || !strengthBar) return;
    
    strengthDiv.style.display = 'block';
    
    let strength = 0;
    let feedback = '';
    let color = '';
    
    // Length check
    if (password.length >= 12) strength += 30;
    else if (password.length >= 8) strength += 20;
    else if (password.length >= 6) strength += 10;
    
    // Contains number
    if (/\d/.test(password)) strength += 20;
    
    // Contains lowercase
    if (/[a-z]/.test(password)) strength += 15;
    
    // Contains uppercase
    if (/[A-Z]/.test(password)) strength += 15;
    
    // Contains special character
    if (/[^a-zA-Z0-9]/.test(password)) strength += 20;
    
    // Set feedback based on strength
    if (strength < 30) {
        feedback = 'Weak';
        color = '#dc3545';
    } else if (strength < 50) {
        feedback = 'Fair';
        color = '#ffc107';
    } else if (strength < 70) {
        feedback = 'Good';
        color = '#17a2b8';
    } else {
        feedback = 'Strong';
        color = '#28a745';
    }
    
    strengthText.textContent = feedback;
    strengthText.style.color = color;
    strengthBar.style.width = strength + '%';
    strengthBar.style.backgroundColor = color;
}

// Change password
async function changePassword() {
    const token = localStorage.getItem('token');
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate
    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('Please fill in all password fields.');
        return;
    }
    
    if (newPassword.length < 6) {
        alert('New password must be at least 6 characters long.');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match.');
        return;
    }
    
    // Check password strength
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecial = /[^a-zA-Z0-9]/.test(newPassword);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecial) {
        alert('Password must contain uppercase, lowercase, number, and special character.');
        return;
    }
    
    try {
        console.log('Changing password...');
        
        const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                currentPassword: currentPassword,
                newPassword: newPassword
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Password changed successfully! Please login with your new password.');
            
            // Clear form
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
            document.getElementById('passwordStrength').style.display = 'none';
            
            // Switch to info tab
            switchProfileTab('info');
            
            // Logout after password change
            if (confirm('Would you like to login now with your new password?')) {
                logout();
            }
        } else {
            alert('❌ ' + (data.message || 'Failed to change password. Please try again.'));
        }
    } catch (error) {
        console.error('Error changing password:', error);
        alert('Failed to change password. Please check your current password and try again.');
    }
}

// Change email (admin only)
async function changeEmail() {
    const token = localStorage.getItem('token');
    const newEmail = document.getElementById('newEmail').value;
    const confirmEmail = document.getElementById('confirmEmail').value;
    const password = document.getElementById('emailPassword').value;
    
    // Validate
    if (!newEmail || !confirmEmail || !password) {
        alert('Please fill in all fields.');
        return;
    }
    
    if (newEmail !== confirmEmail) {
        alert('Email addresses do not match.');
        return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        alert('Please enter a valid email address.');
        return;
    }
    
    try {
        console.log('Changing email...');
        
        const response = await fetch(`${API_BASE_URL}/api/auth/change-email`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                newEmail: newEmail,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Email changed successfully! Please login with your new email.');
            
            // Clear localStorage and logout
            logout();
        } else {
            alert('❌ ' + (data.message || 'Failed to change email. Please try again.'));
        }
    } catch (error) {
        console.error('Error changing email:', error);
        alert('Failed to change email. Please try again.');
    }
}

// 2FA (placeholder - would need backend implementation)
function enable2FA() {
    alert('🔐 Two-Factor Authentication will be available in a future update.\n\nThis feature is currently in development.');
}

// View login history (placeholder)
function viewLoginHistory() {
    const modalHTML = `
        <div class="modal active" id="loginHistoryModal">
            <div class="modal-content" style="max-width: 600px;">
                <span class="close-modal" onclick="closeModalById('loginHistoryModal')">&times;</span>
                <h3 style="color: #0D6986; margin-bottom: 20px;">📋 Login History</h3>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center;">
                    <p style="font-size: 1.1rem; margin-bottom: 10px;">🔒 Login history feature coming soon!</p>
                    <p style="color: #6c757d;">This feature will show all successful and failed login attempts to your account.</p>
                </div>
                
                <button onclick="closeModalById('loginHistoryModal')" class="btn-secondary" style="width: 100%; margin-top: 20px;">Close</button>
            </div>
        </div>
    `;
    
    closeModalById('loginHistoryModal');
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Delete account (with confirmation)
async function deleteAccount() {
    const userRole = localStorage.getItem('userRole');
    
    if (userRole === 'admin') {
        const confirmLastAdmin = confirm('⚠️ WARNING: You are an administrator.\n\nAre you sure you want to delete your account? If you are the only admin, this cannot be undone!');
        if (!confirmLastAdmin) return;
    } else {
        if (!confirm('⚠️ Are you absolutely sure you want to permanently delete your account?\n\nThis action cannot be undone and all your appointment history will be lost.')) {
            return;
        }
    }
    
    const password = prompt('Please enter your password to confirm account deletion:');
    if (!password) return;
    
    const token = localStorage.getItem('token');
    
    try {
        console.log('Deleting account...');
        
        const response = await fetch(`${API_BASE_URL}/api/auth/delete-account`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('🗑️ Your account has been deleted successfully.');
            logout();
        } else {
            alert('❌ ' + (data.message || 'Failed to delete account. Please try again.'));
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        alert('Failed to delete account. Please try again.');
    }
}

// ==================== UI FUNCTIONS ====================
// Setup authentication UI
function setupAuthUI() {
    const signInLink = document.querySelector('.sign-in');
    const userEmail = localStorage.getItem('userEmail');
    const userName = localStorage.getItem('userName');
    const userRole = localStorage.getItem('userRole');
    
    if (signInLink) {
        if (userEmail && userName) {
            // User is logged in
            signInLink.textContent = `${userName.split(' ')[0]}${userRole === 'admin' ? ' (Admin)' : ''}`;
            signInLink.href = '#';
            signInLink.onclick = function(e) {
                e.preventDefault();
                showUserMenu();
            };
            
            // Create user menu
            createUserMenu();
            
            // Update nav-right to show admin badge
            const navRight = document.querySelector('.nav-right');
            
            // Remove existing admin badge if any
            const existingBadge = document.querySelector('.admin-badge');
            if (existingBadge) existingBadge.remove();
            
            if (userRole === 'admin') {
                const adminBadge = document.createElement('span');
                adminBadge.className = 'admin-badge';
                adminBadge.textContent = '👑 Admin';
                adminBadge.style.cssText = 'background: #4CAF50; color: white; padding: 5px 10px; border-radius: 20px; font-size: 0.8rem; margin-right: 10px; font-weight: bold;';
                navRight.insertBefore(adminBadge, signInLink);
            }
        } else {
            // Not logged in
            signInLink.textContent = 'Sign In';
            signInLink.href = '#';
            signInLink.onclick = function(e) {
                e.preventDefault();
                showLoginModal();
            };
            
            // Remove admin badge if exists
            const existingBadge = document.querySelector('.admin-badge');
            if (existingBadge) existingBadge.remove();
        }
    }
}

// Create user dropdown menu
function createUserMenu() {
    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');
    const userRole = localStorage.getItem('userRole');
    
    if (!userName || !userEmail) return;
    
    // Remove existing menu if any
    const existingMenu = document.getElementById('userMenu');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    const menuHTML = `
        <div id="userMenu" class="user-menu">
            <div class="user-info">
                <strong>${userName}</strong>
                <small>${userEmail}</small>
                ${userRole === 'admin' ? '<small style="color: #4CAF50; font-weight: bold;">👑 Administrator</small>' : ''}
            </div>
            <ul>
                <li><a href="#" onclick="viewMyAppointments()">📋 My Appointments</a></li>
                <li><a href="#" onclick="openModal(); closeModalById('userMenu');">📅 Book Appointment</a></li>
                <li><a href="#" onclick="editProfile()">✏️ Edit Profile</a></li>
                ${userRole === 'admin' ? `
                    <li><hr></li>
                    <li><a href="#" onclick="viewStatistics()">📊 View Statistics</a></li>
                    <li><a href="#" onclick="viewAllAppointments()">👥 All Appointments</a></li>
                    <li><a href="#" onclick="editProfile(); switchProfileTab('security'); closeModalById('userMenu');">🛡️ Security Settings</a></li>
                ` : ''}
                <li><hr></li>
                <li><a href="#" onclick="logout()" style="color: #e74c3c;">🚪 Logout</a></li>
            </ul>
        </div>
    `;
    
    // Add styles if not already added
    if (!document.getElementById('user-menu-styles')) {
        const style = document.createElement('style');
        style.id = 'user-menu-styles';
        style.textContent = `
            .user-menu {
                display: none;
                position: absolute;
                top: 100%;
                right: 0;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.15);
                min-width: 240px;
                z-index: 10000;
                overflow: hidden;
                animation: slideDown 0.2s ease;
                border: 1px solid #e9ecef;
            }
            .user-menu.active {
                display: block;
            }
            .user-menu .user-info {
                padding: 20px;
                background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                border-bottom: 1px solid #dee2e6;
            }
            .user-menu .user-info strong {
                display: block;
                color: #212529;
                margin-bottom: 5px;
                font-size: 1.1rem;
            }
            .user-menu .user-info small {
                display: block;
                color: #6c757d;
                font-size: 0.8rem;
                margin-top: 2px;
            }
            .user-menu ul {
                list-style: none;
                margin: 0;
                padding: 0;
            }
            .user-menu li {
                margin: 0;
            }
            .user-menu a {
                display: flex;
                align-items: center;
                padding: 14px 20px;
                color: #212529;
                text-decoration: none;
                transition: all 0.2s;
                font-size: 0.95rem;
            }
            .user-menu a:hover {
                background: #f8f9fa;
                padding-left: 25px;
                color: #0D6986;
            }
            .user-menu hr {
                margin: 8px 0;
                border: none;
                border-top: 1px solid #e9ecef;
            }
            .nav-right {
                position: relative;
            }
            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateY(-15px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.querySelector('.nav-right').insertAdjacentHTML('beforeend', menuHTML);
}

// Show user menu
function showUserMenu() {
    const menu = document.getElementById('userMenu');
    if (menu) {
        menu.classList.toggle('active');
        
        // Close menu when clicking outside
        const closeMenuHandler = function(e) {
            if (!e.target.closest('.nav-right')) {
                menu.classList.remove('active');
                document.removeEventListener('click', closeMenuHandler);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeMenuHandler);
        }, 100);
    }
}

function viewAllAppointments() {
    closeModalById('userMenu');
    viewMyAppointments();
}

// Show login modal
function showLoginModal() {
    // Remove existing modal if any
    const existingModal = document.getElementById('loginModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalHTML = `
        <div class="modal active" id="loginModal">
            <div class="modal-content" style="max-width: 450px;">
                <span class="close-modal" onclick="closeLoginModal()">&times;</span>
                <h2 style="color: #0D6986; text-align: center; margin-bottom: 30px;">Welcome to Healthcare Plus</h2>
                <div class="auth-tabs">
                    <button class="tab-btn active" data-tab="login">🔐 Sign In</button>
                    <button class="tab-btn" data-tab="register">📝 Register</button>
                </div>
                
                <form id="loginForm" class="auth-form active">
                    <div class="form-group">
                        <label for="loginEmail">Email Address</label>
                        <input type="email" id="loginEmail" placeholder="your@email.com" required>
                    </div>
                    <div class="form-group">
                        <label for="loginPassword">Password</label>
                        <input type="password" id="loginPassword" placeholder="••••••••" required>
                    </div>
                    <button type="submit" class="btn-primary" style="width: 100%; padding: 12px;">Sign In</button>
                </form>
                
                <form id="registerForm" class="auth-form">
                    <div class="form-group">
                        <label for="regName">Full Name</label>
                        <input type="text" id="regName" placeholder="John Doe" required>
                    </div>
                    <div class="form-group">
                        <label for="regEmail">Email Address</label>
                        <input type="email" id="regEmail" placeholder="your@email.com" required>
                    </div>
                    <div class="form-group">
                        <label for="regPhone">Phone Number</label>
                        <input type="tel" id="regPhone" placeholder="+1 234 567 8900" required>
                    </div>
                    <div class="form-group">
                        <label for="regPassword">Password</label>
                        <input type="password" id="regPassword" placeholder="•••••••• (min. 6 characters)" required minlength="6">
                    </div>
                    <button type="submit" class="btn-primary" style="width: 100%; padding: 12px;">Create Account</button>
                </form>
                
                <div style="margin-top: 20px; text-align: center; font-size: 0.9rem; color: #6c757d; padding: 15px; background: #e8f4f8; border-radius: 8px;">
                    <p style="margin: 0;"><strong>Demo Admin:</strong> admin@healthcareplus.com / Admin123</p>
                </div>
            </div>
        </div>
    `;
    
    // Add styles if not already added
    if (!document.getElementById('auth-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'auth-modal-styles';
        style.textContent = `
            .auth-tabs {
                display: flex;
                margin-bottom: 25px;
                border-bottom: 2px solid #e9ecef;
            }
            .tab-btn {
                flex: 1;
                padding: 12px;
                background: none;
                border: none;
                font-size: 1rem;
                color: #6c757d;
                cursor: pointer;
                transition: all 0.3s;
                font-weight: 500;
            }
            .tab-btn.active {
                color: #0D6986;
                border-bottom: 3px solid #0D6986;
                font-weight: bold;
            }
            .auth-form {
                display: none;
            }
            .auth-form.active {
                display: block;
            }
            .form-group {
                margin-bottom: 20px;
            }
            .form-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                color: #495057;
            }
            .form-group input {
                width: 100%;
                padding: 12px;
                border: 2px solid #e9ecef;
                border-radius: 8px;
                font-size: 1rem;
                transition: border-color 0.3s;
            }
            .form-group input:focus {
                border-color: #0D6986;
                outline: none;
                box-shadow: 0 0 0 3px rgba(13,105,134,0.1);
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Setup tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all tabs and forms
            document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Show corresponding form
            const tab = this.getAttribute('data-tab');
            const form = document.getElementById(`${tab}Form`);
            if (form) {
                form.classList.add('active');
            }
        });
    });
    
    // Handle login form submission
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        const success = await login(email, password);
        if (success) {
            closeLoginModal();
            location.reload(); // Refresh to update UI
        }
    });
    
    // Handle register form submission
    document.getElementById('registerForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const phone = document.getElementById('regPhone').value;
        const password = document.getElementById('regPassword').value;
        
        const success = await register(name, email, phone, password);
        if (success) {
            closeLoginModal();
            location.reload(); // Refresh to update UI
        }
    });
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.remove();
    }
}

function closeModalById(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

// ==================== OTHER FUNCTIONS ====================
// Dynamic Images Rotation
let currentImageIndex = 0;
const images = document.querySelectorAll('.dynamic-image');

if (images.length > 0) {
    setInterval(() => {
        images[currentImageIndex].classList.remove('active');
        currentImageIndex = (currentImageIndex + 1) % images.length;
        images[currentImageIndex].classList.add('active');
    }, 3000);
}

// Service items click handlers
document.querySelectorAll('.service-item').forEach(item => {
    item.addEventListener('click', function() {
        const serviceName = this.querySelector('h3').textContent;
        openModal();
        // Auto-select the corresponding department in the form
        setTimeout(() => {
            const departmentSelect = document.getElementById('department');
            if (departmentSelect) {
                const option = Array.from(departmentSelect.options).find(
                    opt => opt.text.toLowerCase().includes(serviceName.toLowerCase().slice(0, 5))
                );
                if (option) {
                    departmentSelect.value = option.value;
                }
            }
        }, 100);
    });
});

// Call Now button functionality
document.querySelector('.btn-cta').addEventListener('click', function() {
    if (confirm('Call (254) 123456 for emergency assistance?')) {
        window.location.href = 'tel:+254123456';
    }
});

// Test API connectivity
function testAPIConnection() {
    console.log('Testing API connection...');
    console.log('API Base URL:', API_BASE_URL);
    
    fetch(`${API_BASE_URL}/api/healthtips/random`)
        .then(response => {
            console.log('Health tip API status:', response.status);
            return response.json();
        })
        .then(data => console.log('Health tip API response:', data))
        .catch(error => console.error('Health tip API error:', error));
}

// ==================== INITIALIZATION ====================
// SINGLE DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Frontend loaded. Checking server connection...');
    
    // Setup UI immediately
    setupAuthUI();
    
    // Wait for server to be ready
    const serverReady = await waitForServer();
    
    if (serverReady) {
        await initializeHealthTip();
        testAPIConnection();
    } else {
        // Show warning to user
        const healthTipElement = document.getElementById('healthTip');
        if (healthTipElement) {
            healthTipElement.innerHTML = `
                <div style="color: #856404; background: #fff3cd; padding: 15px; border-radius: 8px; border: 1px solid #ffeaa7;">
                    <strong>⚠️ Backend Server Not Detected</strong><br>
                    Please ensure the backend server is running on port 5000.
                    <br><small>Run: <code style="background: #ffeaa7; padding: 2px 5px; border-radius: 3px;">npm run dev</code> in your backend folder</small>
                </div>
            `;
        }
        
        // Disable forms but show helpful message
        document.querySelectorAll('form button[type="submit"]').forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.title = 'Server offline. Please start the backend server.';
        });
    }
});

// Update the form submission handler
const bookingForm = document.querySelector('form');
if (bookingForm) {
    bookingForm.addEventListener('submit', handleSubmit);
}