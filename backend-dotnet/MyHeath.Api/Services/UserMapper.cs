using MyHeath.Api.Models;

namespace MyHeath.Api.Services;

public static class UserMapper
{
    public static object ToSafe(User u) => new
    {
        id = u.Id,
        firstName = u.FirstName,
        lastName = u.LastName,
        email = u.Email,
        role = u.Role,
        gender = u.Gender,
        hasDiabetes = u.HasDiabetes,
        diabetesType = u.DiabetesType,
        phone = u.Phone,
        assignedDoctor = u.AssignedDoctor,
        specialty = u.Specialty,
        dateOfBirth = u.DateOfBirth,
        createdAt = u.CreatedAt
    };
}
