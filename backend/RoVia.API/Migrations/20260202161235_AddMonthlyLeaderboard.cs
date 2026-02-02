using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RoVia.API.Migrations
{
    /// <inheritdoc />
    public partial class AddMonthlyLeaderboard : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AttractionSuggestions_Users_ReviewedByUserId",
                table: "AttractionSuggestions");

            migrationBuilder.DropForeignKey(
                name: "FK_PromoterApplications_Users_ReviewedByUserId",
                table: "PromoterApplications");

            migrationBuilder.AddColumn<int>(
                name: "CurrentSeasonId",
                table: "Users",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastResetDate",
                table: "Users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MonthlyPoints",
                table: "Users",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "LeaderboardArchives",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    SeasonId = table.Column<int>(type: "int", nullable: false),
                    MonthlyPoints = table.Column<int>(type: "int", nullable: false),
                    Rank = table.Column<int>(type: "int", nullable: false),
                    SeasonStart = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SeasonEnd = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LeaderboardArchives", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LeaderboardArchives_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LeaderboardArchives_UserId",
                table: "LeaderboardArchives",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_AttractionSuggestions_Users_ReviewedByUserId",
                table: "AttractionSuggestions",
                column: "ReviewedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PromoterApplications_Users_ReviewedByUserId",
                table: "PromoterApplications",
                column: "ReviewedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AttractionSuggestions_Users_ReviewedByUserId",
                table: "AttractionSuggestions");

            migrationBuilder.DropForeignKey(
                name: "FK_PromoterApplications_Users_ReviewedByUserId",
                table: "PromoterApplications");

            migrationBuilder.DropTable(
                name: "LeaderboardArchives");

            migrationBuilder.DropColumn(
                name: "CurrentSeasonId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "LastResetDate",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "MonthlyPoints",
                table: "Users");

            migrationBuilder.AddForeignKey(
                name: "FK_AttractionSuggestions_Users_ReviewedByUserId",
                table: "AttractionSuggestions",
                column: "ReviewedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_PromoterApplications_Users_ReviewedByUserId",
                table: "PromoterApplications",
                column: "ReviewedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
