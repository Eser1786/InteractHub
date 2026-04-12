using FluentValidation;
using InteractHub.API.DTOs;

namespace InteractHub.API.DTOs.Validators;

public class CreatePostReportValidator : AbstractValidator<CreatePostReportDto>
{
    public CreatePostReportValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Reason không được để trống")
            .MinimumLength(10).WithMessage("Reason phải có ít nhất 10 ký tự")
            .MaximumLength(500).WithMessage("Reason không được vượt quá 500 ký tự");

        RuleFor(x => x.PostId)
            .GreaterThan(0).WithMessage("PostId phải lớn hơn 0");
    }
}
