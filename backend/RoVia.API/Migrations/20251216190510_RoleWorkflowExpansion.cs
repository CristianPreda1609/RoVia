using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace RoVia.API.Migrations
{
    /// <inheritdoc />
    public partial class RoleWorkflowExpansion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CreatedByUserId",
                table: "Quizzes",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsApproved",
                table: "Quizzes",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "CreatedByUserId",
                table: "Attractions",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsApproved",
                table: "Attractions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "AttractionSuggestions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PromoterId = table.Column<int>(type: "int", nullable: false),
                    AttractionId = table.Column<int>(type: "int", nullable: true),
                    CreatesNewAttraction = table.Column<bool>(type: "bit", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Details = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ProposedName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ProposedDescription = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ProposedRegion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ProposedType = table.Column<int>(type: "int", nullable: true),
                    ProposedLatitude = table.Column<double>(type: "float", nullable: true),
                    ProposedLongitude = table.Column<double>(type: "float", nullable: true),
                    ProposedImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReviewedByUserId = table.Column<int>(type: "int", nullable: true),
                    AdminResponse = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AttractionSuggestions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AttractionSuggestions_Attractions_AttractionId",
                        column: x => x.AttractionId,
                        principalTable: "Attractions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_AttractionSuggestions_Users_PromoterId",
                        column: x => x.PromoterId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AttractionSuggestions_Users_ReviewedByUserId",
                        column: x => x.ReviewedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PromoterApplications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    CompanyName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CompanyWebsite = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ContactEmail = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Motivation = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReviewedByUserId = table.Column<int>(type: "int", nullable: true),
                    AdminNotes = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PromoterApplications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PromoterApplications_Users_ReviewedByUserId",
                        column: x => x.ReviewedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PromoterApplications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "Id", "Name" },
                values: new object[,]
                {
                    { 1, "Visitor" },
                    { 2, "Promoter" },
                    { 3, "Administrator" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_RoleId",
                table: "Users",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_Quizzes_CreatedByUserId",
                table: "Quizzes",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Attractions_CreatedByUserId",
                table: "Attractions",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AttractionSuggestions_AttractionId",
                table: "AttractionSuggestions",
                column: "AttractionId");

            migrationBuilder.CreateIndex(
                name: "IX_AttractionSuggestions_PromoterId",
                table: "AttractionSuggestions",
                column: "PromoterId");

            migrationBuilder.CreateIndex(
                name: "IX_AttractionSuggestions_ReviewedByUserId",
                table: "AttractionSuggestions",
                column: "ReviewedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PromoterApplications_ReviewedByUserId",
                table: "PromoterApplications",
                column: "ReviewedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PromoterApplications_UserId",
                table: "PromoterApplications",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Attractions_Users_CreatedByUserId",
                table: "Attractions",
                column: "CreatedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Quizzes_Users_CreatedByUserId",
                table: "Quizzes",
                column: "CreatedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Roles_RoleId",
                table: "Users",
                column: "RoleId",
                principalTable: "Roles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Attractions_Users_CreatedByUserId",
                table: "Attractions");

            migrationBuilder.DropForeignKey(
                name: "FK_Quizzes_Users_CreatedByUserId",
                table: "Quizzes");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_Roles_RoleId",
                table: "Users");

            migrationBuilder.DropTable(
                name: "AttractionSuggestions");

            migrationBuilder.DropTable(
                name: "PromoterApplications");

            migrationBuilder.DropTable(
                name: "Roles");

            migrationBuilder.DropIndex(
                name: "IX_Users_RoleId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Quizzes_CreatedByUserId",
                table: "Quizzes");

            migrationBuilder.DropIndex(
                name: "IX_Attractions_CreatedByUserId",
                table: "Attractions");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Quizzes");

            migrationBuilder.DropColumn(
                name: "IsApproved",
                table: "Quizzes");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Attractions");

            migrationBuilder.DropColumn(
                name: "IsApproved",
                table: "Attractions");
        }
    }
}
