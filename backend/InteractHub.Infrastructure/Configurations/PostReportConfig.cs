using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using InteractHub.Application.Entities;

namespace InteractHub.Infrastructure.Configurations;
public class PostReportConfig : IEntityTypeConfiguration<PostReport>
{
    public void Configure(EntityTypeBuilder<PostReport> builder)
    {
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Reason).IsRequired();

        builder.HasOne(r => r.Post).WithMany(p => p.Reports).HasForeignKey(r => r.PostId).OnDelete(DeleteBehavior.Cascade);
        
        builder.HasOne(r => r.User).WithMany(u => u.Reports).HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.NoAction);
    }
}