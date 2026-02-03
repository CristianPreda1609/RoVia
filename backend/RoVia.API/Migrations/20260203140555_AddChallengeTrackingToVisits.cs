using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RoVia.API.Migrations
{
    /// <inheritdoc />
    public partial class AddChallengeTrackingToVisits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DailyChallengeId",
                table: "UserAttractionVisits",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "WeeklyChallengeId",
                table: "UserAttractionVisits",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DailyChallengeId",
                table: "UserAttractionVisits");

            migrationBuilder.DropColumn(
                name: "WeeklyChallengeId",
                table: "UserAttractionVisits");
        }
    }
}
