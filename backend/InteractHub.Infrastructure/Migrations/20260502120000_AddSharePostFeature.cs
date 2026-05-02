using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InteractHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSharePostFeature : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SharedPostId",
                table: "Posts",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Posts_SharedPostId",
                table: "Posts",
                column: "SharedPostId");

            migrationBuilder.AddForeignKey(
                name: "FK_Posts_Posts_SharedPostId",
                table: "Posts",
                column: "SharedPostId",
                principalTable: "Posts",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Posts_Posts_SharedPostId",
                table: "Posts");

            migrationBuilder.DropIndex(
                name: "IX_Posts_SharedPostId",
                table: "Posts");

            migrationBuilder.DropColumn(
                name: "SharedPostId",
                table: "Posts");
        }
    }
}
