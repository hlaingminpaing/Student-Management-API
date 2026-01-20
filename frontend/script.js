$(document).ready(function () {
    const API_ENDPOINT = "https://vwu7l4uocj.execute-api.ap-southeast-1.amazonaws.com/dev/students";

    // Create Student
    $('#studentForm').on('submit', function (event) {
        event.preventDefault();
        const inputData = {
            studentID: $('#studentID').val(),
            name: $('#name').val(),
            email: $('#email').val(),
            major: $('#major').val(),
            gpa: parseFloat($('#gpa').val())
        };

        if (!inputData.studentID || !inputData.name || !inputData.email || !inputData.major || !inputData.gpa) {
            $('#message').text('Please fill in all fields.').show();
            return;
        }
        if (isNaN(inputData.gpa) || inputData.gpa < 0 || inputData.gpa > 4) {
            $('#message').text('Please enter a valid GPA (0-4).').show();
            return;
        }

        $.ajax({
            url: API_ENDPOINT,
            type: 'POST',
            data: JSON.stringify(inputData),
            contentType: 'application/json',
            success: function (response) {
                $('#message').text('Student created successfully!').show().fadeOut(3000);
                $('#studentForm')[0].reset();
            },
            error: function (jqXHR) {
                let errorMsg = 'Error creating student.';
                try {
                    const errorResponse = JSON.parse(jqXHR.responseText);
                    if (errorResponse.error) errorMsg = errorResponse.error;
                } catch (e) {}
                $('#message').text(errorMsg).show().fadeOut(3000);
            }
        });
    });

    // Get Student
    $('#getStudent').on('click', function () {
        const studentId = $('#studentID').val();
        if (!studentId) {
            $('#message').text('Please enter a Student ID.').show();
            return;
        }

        $.ajax({
            url: `${API_ENDPOINT}/${studentId}`,
            type: 'GET',
            contentType: 'application/json',
            success: function (response) {
                $('#studentTableBody').empty();
                $('#studentTable').show();
                $('#studentTableBody').append(`
                    <tr>
                        <td>${response.StudentID}</td>
                        <td>${response.Name}</td>
                        <td>${response.Email}</td>
                        <td>${response.Major}</td>
                        <td>${response.GPA}</td>
                    </tr>
                `);
                $('#message').text('Student retrieved successfully!').show().fadeOut(3000);
            },
            error: function (jqXHR) {
                let errorMsg = 'Error retrieving student.';
                try {
                    const errorResponse = JSON.parse(jqXHR.responseText);
                    if (errorResponse.error) errorMsg = errorResponse.error;
                } catch (e) {}
                $('#message').text(errorMsg).show().fadeOut(3000);
            }
        });
    });

    // Update Student
    $('#updateStudent').on('click', function () {
        const studentId = $('#studentID').val();
        const inputData = {
            name: $('#name').val(),
            email: $('#email').val(),
            major: $('#major').val(),
            gpa: parseFloat($('#gpa').val())
        };

        if (!studentId) {
            $('#message').text('Please enter a Student ID.').show();
            return;
        }
        if (!inputData.name || !inputData.email || !inputData.major || !inputData.gpa) {
            $('#message').text('Please fill in all fields.').show();
            return;
        }
        if (isNaN(inputData.gpa) || inputData.gpa < 0 || inputData.gpa > 4) {
            $('#message').text('Please enter a valid GPA (0-4).').show();
            return;
        }

        $.ajax({
            url: `${API_ENDPOINT}/${studentId}`,
            type: 'PUT',
            data: JSON.stringify(inputData),
            contentType: 'application/json',
            success: function (response) {
                $('#message').text('Student updated successfully!').show().fadeOut(3000);
                $('#studentForm')[0].reset();
            },
            error: function (jqXHR) {
                let errorMsg = 'Error updating student.';
                try {
                    const errorResponse = JSON.parse(jqXHR.responseText);
                    if (errorResponse.error) errorMsg = errorResponse.error;
                } catch (e) {}
                $('#message').text(errorMsg).show().fadeOut(3000);
            }
        });
    });

    // Delete Student
    $('#deleteStudent').on('click', function () {
        const studentId = $('#studentID').val();
        if (!studentId) {
            $('#message').text('Please enter a Student ID.').show();
            return;
        }

        $.ajax({
            url: `${API_ENDPOINT}/${studentId}`,
            type: 'DELETE',
            contentType: 'application/json',
            success: function (response) {
                $('#message').text('Student deleted successfully!').show().fadeOut(3000);
                $('#studentForm')[0].reset();
                $('#studentTable').hide();
            },
            error: function (jqXHR) {
                let errorMsg = 'Error deleting student.';
                try {
                    const errorResponse = JSON.parse(jqXHR.responseText);
                    if (errorResponse.error) errorMsg = errorResponse.error;
                } catch (e) {}
                $('#message').text(errorMsg).show().fadeOut(3000);
            }
        });
    });

    // Clear Form
    $('#clearForm').on('click', function () {
        $('#studentForm')[0].reset();
        $('#studentTable').hide();
        $('#message').text('Form cleared.').show().fadeOut(3000);
    });
});