using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InteractHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUpdateToPost : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Posts",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Posts");
        }
    }
}
