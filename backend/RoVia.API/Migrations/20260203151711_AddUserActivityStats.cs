using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RoVia.API.Migrations
{
    /// <inheritdoc />
    public partial class AddUserActivityStats : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserActivityStats",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "int", nullable: false),
                    AttractionsCreated = table.Column<int>(type: "int", nullable: false),
                    AttractionsUpdated = table.Column<int>(type: "int", nullable: false),
                    QuizzesCreated = table.Column<int>(type: "int", nullable: false),
                    QuizzesUpdated = table.Column<int>(type: "int", nullable: false),
                    SuggestionsSubmitted = table.Column<int>(type: "int", nullable: false),
                    SuggestionsApproved = table.Column<int>(type: "int", nullable: false),
                    LastUpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserActivityStats", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_UserActivityStats_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserActivityStats");
        }
    }
}
