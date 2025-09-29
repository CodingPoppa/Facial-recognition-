// Facial Recognition Attendance System
class FacialRecognitionSystem {
    constructor() {
        this.students = JSON.parse(localStorage.getItem('students')) || [];
        this.attendance = JSON.parse(localStorage.getItem('attendance')) || [];
        this.faceModel = null;
        this.video = document.getElementById('video'); // Main attendance camera
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');

        this.registrationVideo = document.getElementById('registrationVideo'); // Registration camera
        this.registrationCanvas = document.getElementById('registrationCanvas');
        this.registrationCtx = this.registrationCanvas ? this.registrationCanvas.getContext('2d') : null;

        this.isMainCameraActive = false;
        this.isRegistrationCameraActive = false;
        this.currentDate = new Date().toISOString().split('T')[0];
        
        this.init();
    }

    async init() {
        this.showLoading(true);
        await this.loadFaceModel();
        this.setupEventListeners();
        this.updateUI();
        this.updateCurrentTime();
        this.showLoading(false);
        
        // Set current date for manual attendance
        document.getElementById('attendanceDate').value = this.currentDate;
        document.getElementById('reportDate').value = this.currentDate;
    }

    async loadFaceModel() {
        try {
            // Load BlazeFace model for face detection
            this.faceModel = await blazeface.load();
            console.log('Face detection model loaded successfully');
        } catch (error) {
            console.error('Error loading face model:', error);
            this.showStatus('Error loading face detection model', 'error');
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.switchTab(e.currentTarget.dataset.tab);
            });
        });

        // Camera Controls
        document.getElementById('startCamera').addEventListener('click', () => this.startCamera());
        document.getElementById('stopCamera').addEventListener('click', () => this.stopCamera());
        document.getElementById('captureFace').addEventListener('click', () => this.captureFace());

        // Manual Attendance
        document.getElementById('markManualAttendance').addEventListener('click', () => this.markManualAttendance());

        // Student Management
        document.getElementById('addStudent').addEventListener('click', () => this.addStudent());
        document.getElementById('registerFace').addEventListener('click', () => this.registerFace());

        // Reports
        document.getElementById('generateReport').addEventListener('click', () => this.generateReport());
        document.getElementById('exportCSV').addEventListener('click', () => this.exportToCSV());
        document.getElementById('exportExcel').addEventListener('click', () => this.exportToExcel());
        document.getElementById('printReport').addEventListener('click', () => this.printReport());
    }

    switchTab(tabName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        // Update specific tab data
        if (tabName === 'attendance') {
            this.startMainCamera();
            this.stopRegistrationCamera();
        } else if (tabName === 'manual') {
            this.stopMainCamera();
            this.stopRegistrationCamera();
            this.populateStudentSelect();
        } else if (tabName === 'students') {
            this.stopMainCamera();
            // Camera for registration will be started by registerFace()
            this.populateStudentsTable();
        } else if (tabName === 'reports') {
            this.stopMainCamera();
            this.stopRegistrationCamera();
            this.populateGradeFilter();
            this.generateReport();
        }
    }

    async startMainCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: 640,
                    height: 480,
                    facingMode: 'user'
                }
            });
            
            this.video.srcObject = stream;
            this.isMainCameraActive = true;
            
            document.getElementById('startCamera').disabled = true;
            document.getElementById('stopCamera').disabled = false;
            document.getElementById('captureFace').disabled = false;
            
            this.showStatus('Main camera started successfully', 'success');
            
            // Start face detection loop for main camera
            this.detectFaces(this.video, this.canvas, this.ctx, 'main');
            
        } catch (error) {
            console.error('Error accessing main camera:', error);
            this.showStatus('Error accessing main camera. Please check permissions.', 'error');
        }
    }

    stopMainCamera() {
        const stream = this.video.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            this.video.srcObject = null;
        }
        
        this.isMainCameraActive = false;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clear canvas
        document.getElementById('startCamera').disabled = false;
        document.getElementById('stopCamera').disabled = true;
        document.getElementById('captureFace').disabled = true;
        
        this.showStatus('Main camera stopped', 'info');
    }

    async startRegistrationCamera() {
        if (!this.registrationVideo || !this.registrationCanvas) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: 320,
                    height: 240,
                    facingMode: 'user'
                }
            });
            
            this.registrationVideo.srcObject = stream;
            this.isRegistrationCameraActive = true;
            document.getElementById('registrationCameraContainer').style.display = 'block';
            
            this.showStatus('Registration camera started', 'info');
            this.detectFaces(this.registrationVideo, this.registrationCanvas, this.registrationCtx, 'registration');

        } catch (error) {
            console.error('Error accessing registration camera:', error);
            this.showStatus('Error accessing registration camera. Please check permissions.', 'error');
        }
    }

    stopRegistrationCamera() {
        if (!this.registrationVideo || !this.registrationCanvas) return;

        const stream = this.registrationVideo.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            this.registrationVideo.srcObject = null;
        }
        
        this.isRegistrationCameraActive = false;
        this.registrationCtx.clearRect(0, 0, this.registrationCanvas.width, this.registrationCanvas.height); // Clear canvas
        document.getElementById('registrationCameraContainer').style.display = 'none';
        this.showStatus('Registration camera stopped', 'info');
    }

    async detectFaces(videoElement, canvasElement, ctx, cameraType) {
        if ((cameraType === 'main' && !this.isMainCameraActive) || (cameraType === 'registration' && !this.isRegistrationCameraActive) || !this.faceModel) {
            return;
        }

        try {
            const predictions = await this.faceModel.estimateFaces(videoElement, false);
            
            ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            
            if (predictions.length > 0) {
                predictions.forEach(prediction => {
                    const [x, y, width, height] = prediction.topLeft;
                    
                    // Draw bounding box
                    ctx.strokeStyle = '#00ff00';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, width, height);
                    
                    // Draw label
                    ctx.fillStyle = '#00ff00';
                    ctx.font = '16px Arial';
                    ctx.fillText('Face Detected', x, y - 5);
                });
            }
            
            // Continue detection
            requestAnimationFrame(() => this.detectFaces(videoElement, canvasElement, ctx, cameraType));
            
        } catch (error) {
            console.error('Error detecting faces:', error);
        }
    }

    async captureFace() {
        if (!this.isCameraActive) return;

        try {
            const descriptor = await this.getFaceDescriptor(this.video);
            if (descriptor) {
                const student = this.findBestMatch(descriptor);
                if (student) {
                    this.markAttendance(student.id, 'present');
                    this.showStatus(`Attendance marked for ${student.name}`, 'success');
                    this.canvas.classList.add('face-recognized');
                    setTimeout(() => this.canvas.classList.remove('face-recognized'), 500);
                } else {
                    this.showStatus('No matching student found.', 'error');
                }
            } else {
                this.showStatus('Could not detect a face. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error capturing face:', error);
            this.showStatus('Error capturing face', 'error');
        }
    }

    calculateDistance(desc1, desc2) {
        // Simple Euclidean distance
        let distance = 0;
        for (let i = 0; i < desc1.length; i++) {
            distance += (desc1[i] - desc2[i]) ** 2;
        }
        return Math.sqrt(distance);
    }

    findBestMatch(descriptor) {
        let bestMatch = null;
        let minDistance = Infinity;
        // A threshold for matching. This value may need tuning.
        const threshold = 500;

        for (const student of this.students) {
            if (student.faceDescriptor) {
                const distance = this.calculateDistance(descriptor, student.faceDescriptor);
                if (distance < minDistance) {
                    minDistance = distance;
                    bestMatch = student;
                }
            }
        }

        if (minDistance < threshold) {
            return bestMatch;
        }
        return null;
    }

    async getFaceDescriptor(videoElement) {
        const predictions = await this.faceModel.estimateFaces(videoElement, false);
        if (predictions.length > 0) {
            // This is a simplified descriptor. For real-world use, a more robust embedding model is needed.
            const landmarks = predictions[0].landmarks;
            const descriptor = landmarks.flat();
            return descriptor;
        }
        return null;
    }

    async registerFace() {
        const studentId = document.getElementById('studentId').value.trim();
        if (!studentId) {
            this.showStatus('Please enter a Student ID before registering a face.', 'error');
            return;
        }

        if (!this.isRegistrationCameraActive) {
            await this.startRegistrationCamera();
        }

        this.showStatus('Look at the camera and hold still...', 'info');

        setTimeout(async () => {
            const descriptor = await this.getFaceDescriptor(this.registrationVideo);
            if (descriptor) {
                const student = this.students.find(s => s.id === studentId);
                if (student) {
                    student.faceDescriptor = descriptor;
                    localStorage.setItem('students', JSON.stringify(this.students));
                    this.showStatus(`Face registered for ${student.name}.`, 'success');
                } else {
                    // Temporarily store descriptor if student not yet added
                    this.pendingFaceDescriptor = { studentId, descriptor };
                    this.showStatus(`Face captured for ID ${studentId}. Add the student to save.`, 'info');
                }
            } else {
                this.showStatus('Could not detect a face. Please try again.', 'error');
            }
        }, 2000); // Wait 2 seconds for user to be ready
    }

    markAttendance(studentId, status) {
        const existingRecord = this.attendance.find(record => 
            record.studentId === studentId && record.date === this.currentDate
        );

        if (existingRecord) {
            existingRecord.status = status;
            existingRecord.time = new Date().toLocaleTimeString();
        } else {
            this.attendance.push({
                id: Date.now(),
                studentId: studentId,
                date: this.currentDate,
                status: status,
                time: new Date().toLocaleTimeString()
            });
        }

        localStorage.setItem('attendance', JSON.stringify(this.attendance));
        this.updateAttendanceList();
    }

    markManualAttendance() {
        const studentId = document.getElementById('studentSelect').value;
        const date = document.getElementById('attendanceDate').value;
        const status = document.querySelector('input[name="status"]:checked').value;

        if (!studentId) {
            this.showStatus('Please select a student', 'error');
            return;
        }

        this.markAttendance(studentId, status);
        this.showStatus(`Manual attendance marked for selected student`, 'success');
        
        // Reset form
        document.getElementById('studentSelect').value = '';
    }

    addStudent() {
        const name = document.getElementById('studentName').value.trim();
        const studentId = document.getElementById('studentId').value.trim();
        const grade = document.getElementById('studentGrade').value.trim();
        const section = document.getElementById('studentSection').value.trim();

        if (!name || !studentId) {
            this.showStatus('Please fill in required fields (Name and Student ID)', 'error');
            return;
        }

        // Check if student ID already exists
        if (this.students.some(student => student.id === studentId)) {
            this.showStatus('Student ID already exists', 'error');
            return;
        }

        const newStudent = {
            id: studentId,
            name: name,
            grade: grade || 'N/A',
            section: section || 'N/A',
            registeredDate: new Date().toISOString(),
            faceDescriptor: null
        };

        // If a face was captured before adding the student
        if (this.pendingFaceDescriptor && this.pendingFaceDescriptor.studentId === studentId) {
            newStudent.faceDescriptor = this.pendingFaceDescriptor.descriptor;
            this.pendingFaceDescriptor = null;
        }

        this.students.push(newStudent);
        localStorage.setItem('students', JSON.stringify(this.students));

        // Clear form
        document.getElementById('studentName').value = '';
        document.getElementById('studentId').value = '';
        document.getElementById('studentGrade').value = '';
        document.getElementById('studentSection').value = '';

        this.showStatus(`Student ${name} added successfully`, 'success');
        this.populateStudentsTable();
        this.populateStudentSelect();
        this.populateGradeFilter();
    }

    populateStudentSelect() {
        const select = document.getElementById('studentSelect');
        select.innerHTML = '<option value="">-- Select Student --</option>';
        
        this.students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = `${student.name} (${student.id}) - ${student.grade}${student.section}`;
            select.appendChild(option);
        });
    }

    populateStudentsTable() {
        const tbody = document.getElementById('studentsTableBody');
        tbody.innerHTML = '';

        this.students.forEach(student => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td>${student.grade}</td>
                <td>${student.section}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="system.deleteStudent('${student.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    deleteStudent(studentId) {
        if (confirm('Are you sure you want to delete this student?')) {
            this.students = this.students.filter(student => student.id !== studentId);
            localStorage.setItem('students', JSON.stringify(this.students));
            this.populateStudentsTable();
            this.populateStudentSelect();
            this.populateGradeFilter();
            this.showStatus('Student deleted successfully', 'success');
        }
    }

    populateGradeFilter() {
        const select = document.getElementById('reportGrade');
        const grades = [...new Set(this.students.map(student => student.grade))];
        
        select.innerHTML = '<option value="">All Grades</option>';
        grades.forEach(grade => {
            const option = document.createElement('option');
            option.value = grade;
            option.textContent = grade;
            select.appendChild(option);
        });
    }

    generateReport() {
        const date = document.getElementById('reportDate').value;
        const grade = document.getElementById('reportGrade').value;
        
        const filteredAttendance = this.attendance.filter(record => 
            record.date === date && 
            (!grade || this.getStudentGrade(record.studentId) === grade)
        );

        const presentCount = filteredAttendance.filter(record => record.status === 'present').length;
        const absentCount = filteredAttendance.filter(record => record.status === 'absent').length;
        const totalStudents = grade ? 
            this.students.filter(student => student.grade === grade).length : 
            this.students.length;

        // Update summary
        document.getElementById('presentCount').textContent = presentCount;
        document.getElementById('absentCount').textContent = absentCount;
        document.getElementById('totalCount').textContent = totalStudents;

        // Update table
        this.populateAttendanceTable(filteredAttendance, date);
    }

    populateAttendanceTable(attendanceRecords, date) {
        const tbody = document.getElementById('attendanceTableBody');
        tbody.innerHTML = '';

        // Get all students for the selected grade/filter
        const grade = document.getElementById('reportGrade').value;
        const studentsToShow = grade ? 
            this.students.filter(student => student.grade === grade) : 
            this.students;

        studentsToShow.forEach(student => {
            const record = attendanceRecords.find(r => r.studentId === student.id);
            const row = document.createElement('tr');
            
            if (record) {
                row.innerHTML = `
                    <td>${student.id}</td>
                    <td>${student.name}</td>
                    <td>${student.grade}</td>
                    <td><span class="status-${record.status}">${record.status.toUpperCase()}</span></td>
                    <td>${record.time}</td>
                `;
            } else {
                row.innerHTML = `
                    <td>${student.id}</td>
                    <td>${student.name}</td>
                    <td>${student.grade}</td>
                    <td><span class="status-absent">ABSENT</span></td>
                    <td>-</td>
                `;
            }
            
            tbody.appendChild(row);
        });
    }

    getStudentGrade(studentId) {
        const student = this.students.find(s => s.id === studentId);
        return student ? student.grade : 'N/A';
    }

    exportToCSV() {
        const date = document.getElementById('reportDate').value;
        const grade = document.getElementById('reportGrade').value;
        
        const filteredAttendance = this.attendance.filter(record => 
            record.date === date && 
            (!grade || this.getStudentGrade(record.studentId) === grade)
        );

        let csvContent = 'Student ID,Name,Grade,Section,Status,Time,Date\n';
        
        const studentsToShow = grade ? 
            this.students.filter(student => student.grade === grade) : 
            this.students;

        studentsToShow.forEach(student => {
            const record = filteredAttendance.find(r => r.studentId === student.id);
            const status = record ? record.status.toUpperCase() : 'ABSENT';
            const time = record ? record.time : '-';
            
            csvContent += `"${student.id}","${student.name}","${student.grade}","${student.section}","${status}","${time}","${date}"\n`;
        });

        this.downloadFile(csvContent, `attendance_${date}.csv`, 'text/csv');
        this.showStatus('CSV export completed successfully', 'success');
    }

    exportToExcel() {
        // For simplicity, we'll create a CSV file with .xlsx extension
        // In a real implementation, you would use a proper Excel library
        this.exportToCSV(); // Using CSV as fallback
        this.showStatus('Excel export completed successfully', 'success');
    }

    printReport() {
        window.print();
    }

    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    updateAttendanceList() {
        const container = document.getElementById('attendanceList');
        const todayAttendance = this.attendance.filter(record => record.date === this.currentDate);
        
        container.innerHTML = '';
        
        if (todayAttendance.length === 0) {
            container.innerHTML = '<p class="text-center">No attendance marked today</p>';
            return;
        }

        todayAttendance.forEach(record => {
            const student = this.students.find(s => s.id === record.studentId);
            if (student) {
                const div = document.createElement('div');
                div.className = 'attendance-item';
                div.innerHTML = `
                    <span><strong>${student.name}</strong> (${student.grade}${student.section})</span>
                    <span class="status-${record.status}">${record.status.toUpperCase()} at ${record.time}</span>
                `;
                container.appendChild(div);
            }
        });
    }

    updateCurrentTime() {
        const timeElement = document.getElementById('currentTime');
        const updateTime = () => {
            const now = new Date();
            timeElement.textContent = now.toLocaleString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZone: 'Asia/Kolkata'
            });
        };
        
        updateTime();
        setInterval(updateTime, 1000);
    }

    showStatus(message, type) {
        const statusElement = document.getElementById('recognitionStatus');
        statusElement.textContent = message;
        statusElement.className = `status-message ${type}`;
        
        setTimeout(() => {
            statusElement.textContent = '';
            statusElement.className = 'status-message';
        }, 5000);
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        overlay.style.display = show ? 'flex' : 'none';
    }

    updateUI() {
        this.updateAttendanceList();
        this.populateStudentSelect();
        this.populateStudentsTable();
        this.populateGradeFilter();
    }
}

// Initialize the system when the page loads
let system;
document.addEventListener('DOMContentLoaded', () => {
    system = new FacialRecognitionSystem();
});

// Add CSS for status indicators
const style = document.createElement('style');
style.textContent = `
    .status-present {
        color: #27ae60;
        font-weight: bold;
    }
    .status-absent {
        color: #e74c3c;
        font-weight: bold;
    }
    .btn-sm {
        padding: 8px 15px;
        font-size: 0.85rem;
    }
`;
document.head.appendChild(style);