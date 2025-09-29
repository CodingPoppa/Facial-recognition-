# Rural School Facial Recognition Attendance System

A comprehensive web-based attendance system designed specifically for rural schools, featuring facial recognition technology with manual override capabilities.

## Features

### 🎯 Core Functionality
- **Facial Recognition Attendance**: Uses BlazeFace model for face detection
- **Manual Attendance Marking**: Fallback option for technical issues
- **Student Management**: Add, view, and manage student records
- **Attendance Reports**: Generate detailed attendance reports
- **Data Export**: Export attendance data to CSV/Excel formats
- **Real-time Updates**: Live clock and instant status updates

### 🎨 Design Features
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Classy UI**: Professional and clean interface suitable for educational environments
- **Accessibility**: Keyboard navigation and screen reader friendly
- **Local Storage**: Data persists in browser's local storage

## Technical Requirements

### Browser Requirements
- Modern web browser with camera access (Chrome, Firefox, Safari, Edge)
- Webcam for facial recognition functionality
- JavaScript enabled

### Libraries Used
- TensorFlow.js for machine learning
- BlazeFace model for face detection
- Font Awesome for icons
- Google Fonts for typography

## Installation & Setup

### Quick Start
1. **Download the files**: 
   - `index.html`
   - `styles.css`
   - `script.js`

2. **Open the application**:
   ```bash
   # Simply open index.html in a web browser
   open index.html
   ```

3. **Allow camera permissions** when prompted for facial recognition

### Server Deployment (Optional)
For production use, deploy to a web server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

## Usage Guide

### 1. Student Management
1. Navigate to "Student Management" tab
2. Fill in student details (Name, ID, Grade, Section)
3. **(Optional) Click "Capture & Register Face" to capture a facial signature for the student.**
4. Click "Add Student" to register.
5. Students will appear in the registered students table.

### 2. Facial Recognition Attendance
1. Go to "Facial Recognition" tab
2. Click "Start Camera" to enable webcam
3. Position student in front of camera
4. Click "Capture Attendance" to mark presence
5. System will automatically detect and record attendance

### 3. Manual Attendance
1. Navigate to "Manual Attendance" tab
2. Select student from dropdown
3. Choose date and attendance status
4. Click "Mark Attendance" to record

### 4. Reports & Export
1. Go to "Reports & Export" tab
2. Select date and filter by grade (optional)
3. Click "Generate Report" to view statistics
4. Use export buttons to download data:
   - CSV: For spreadsheet applications
   - Excel: For Microsoft Excel
   - Print: For physical copies

## System Architecture

### Data Storage
- **Local Storage**: All data is stored in browser's localStorage
- **Student Data**: `students` array with student profiles
- **Attendance Records**: `attendance` array with timestamped records

### Face Recognition
- **BlazeFace Model**: Lightweight face detection model
- **Real-time Detection**: Continuous face detection while camera is active
- **Bounding Boxes**: Visual feedback with face detection rectangles

## Security Considerations

### Privacy Features
- All data remains locally in the browser
- No external data transmission
- Camera access requires explicit user permission
- Data can be cleared by clearing browser storage

### Data Backup
- Export data regularly using CSV/Excel export
- Manual backup of localStorage data recommended

## Troubleshooting

### Common Issues

1. **Camera Not Working**
   - Ensure browser has camera permissions
   - Check if another application is using the camera
   - Try refreshing the page

2. **Face Detection Not Working**
   - Ensure good lighting conditions
   - Position face clearly in camera view
   - Check browser console for errors

3. **Data Not Saving**
   - Check if browser allows localStorage
   - Ensure JavaScript is enabled

### Browser Compatibility
- Chrome 60+ (Recommended)
- Firefox 55+
- Safari 11+
- Edge 79+

## Customization

### Styling
Modify `styles.css` to customize:
- Color scheme
- Font styles
- Layout dimensions
- Responsive breakpoints

### Functionality
Edit `script.js` to customize:
- Attendance rules
- Report formats
- Export options
- Student fields

## Support

### Getting Help
- Check browser console for error messages
- Ensure all required files are in same directory
- Verify camera permissions are granted

### System Requirements
- Modern web browser with ES6 support
- Webcam with at least 640x480 resolution
- Stable internet connection for initial model loading

## License

This system is provided as-is for educational and demonstration purposes. Please ensure compliance with local privacy regulations when deploying in production environments.

## Future Enhancements

Potential improvements:
- Cloud synchronization
- Advanced face recognition with training
- Multi-user support
- Offline functionality
- Database integration
- Mobile app version

---

**Note**: This is a prototype system. For production use in rural schools, consider additional factors like internet connectivity, power backup, and local data storage solutions.