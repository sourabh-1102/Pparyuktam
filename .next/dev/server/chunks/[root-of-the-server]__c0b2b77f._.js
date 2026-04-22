module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[externals]/http [external] (http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}),
"[externals]/https [external] (https, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}),
"[externals]/events [external] (events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}),
"[project]/src/lib/generateCertificate.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateCertificatePDF",
    ()=>generateCertificatePDF
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$pdf$2d$lib$2f$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/pdf-lib/es/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$pdf$2d$lib$2f$es$2f$api$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/pdf-lib/es/api/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$pdf$2d$lib$2f$es$2f$api$2f$colors$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/pdf-lib/es/api/colors.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$pdf$2d$lib$2f$es$2f$api$2f$StandardFonts$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/pdf-lib/es/api/StandardFonts.js [app-route] (ecmascript)");
;
async function generateCertificatePDF(data) {
    const doc = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$pdf$2d$lib$2f$es$2f$api$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PDFDocument"].create();
    const page = doc.addPage([
        842,
        595
    ]); // A4 landscape
    const helveticaBold = await doc.embedFont(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$pdf$2d$lib$2f$es$2f$api$2f$StandardFonts$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["StandardFonts"].HelveticaBold);
    const helvetica = await doc.embedFont(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$pdf$2d$lib$2f$es$2f$api$2f$StandardFonts$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["StandardFonts"].Helvetica);
    const timesItalic = await doc.embedFont(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$pdf$2d$lib$2f$es$2f$api$2f$StandardFonts$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["StandardFonts"].TimesRomanItalic);
    const { width, height } = page.getSize();
    // Colors
    const primaryColor = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$pdf$2d$lib$2f$es$2f$api$2f$colors$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["rgb"])(0.27, 0.35, 0.65); // Deep blue
    const goldColor = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$pdf$2d$lib$2f$es$2f$api$2f$colors$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["rgb"])(0.75, 0.62, 0.23); // Gold
    const darkText = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$pdf$2d$lib$2f$es$2f$api$2f$colors$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["rgb"])(0.15, 0.15, 0.15);
    const lightText = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$pdf$2d$lib$2f$es$2f$api$2f$colors$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["rgb"])(0.4, 0.4, 0.4);
    // === BORDER ===
    const borderInset = 30;
    page.drawRectangle({
        x: borderInset,
        y: borderInset,
        width: width - 2 * borderInset,
        height: height - 2 * borderInset,
        borderColor: goldColor,
        borderWidth: 3
    });
    // Inner border
    page.drawRectangle({
        x: borderInset + 8,
        y: borderInset + 8,
        width: width - 2 * (borderInset + 8),
        height: height - 2 * (borderInset + 8),
        borderColor: primaryColor,
        borderWidth: 1
    });
    // === HEADER ===
    const headerY = height - 80;
    // Type label
    const typeLabels = {
        Participation: "CERTIFICATE OF PARTICIPATION",
        LOE: "LETTER OF EXPERIENCE",
        Confirmation: "CERTIFICATE OF CONFIRMATION"
    };
    const certTitle = typeLabels[data.cert_type] || "CERTIFICATE";
    // "PARYUKTAM" brand
    const brandText = "PARYUKTAM";
    const brandWidth = helveticaBold.widthOfTextAtSize(brandText, 14);
    page.drawText(brandText, {
        x: (width - brandWidth) / 2,
        y: headerY + 10,
        size: 14,
        font: helveticaBold,
        color: primaryColor
    });
    // Main title
    const titleWidth = helveticaBold.widthOfTextAtSize(certTitle, 28);
    page.drawText(certTitle, {
        x: (width - titleWidth) / 2,
        y: headerY - 25,
        size: 28,
        font: helveticaBold,
        color: primaryColor
    });
    // Decorative line
    page.drawLine({
        start: {
            x: width / 2 - 120,
            y: headerY - 40
        },
        end: {
            x: width / 2 + 120,
            y: headerY - 40
        },
        thickness: 2,
        color: goldColor
    });
    // === BODY ===
    const bodyY = headerY - 80;
    const presentedText = "This is to certify that";
    const ptWidth = helvetica.widthOfTextAtSize(presentedText, 14);
    page.drawText(presentedText, {
        x: (width - ptWidth) / 2,
        y: bodyY,
        size: 14,
        font: helvetica,
        color: lightText
    });
    // Student name (large)
    const nameWidth = helveticaBold.widthOfTextAtSize(data.student_name, 32);
    page.drawText(data.student_name, {
        x: (width - nameWidth) / 2,
        y: bodyY - 45,
        size: 32,
        font: helveticaBold,
        color: darkText
    });
    // Underline name
    page.drawLine({
        start: {
            x: (width - nameWidth) / 2 - 10,
            y: bodyY - 50
        },
        end: {
            x: (width + nameWidth) / 2 + 10,
            y: bodyY - 50
        },
        thickness: 1,
        color: goldColor
    });
    // Body text (description varies by type)
    let bodyLines = [];
    if (data.cert_type === "Participation") {
        bodyLines = [
            `has successfully participated in the project "${data.project_title}"`,
            `as a member of Team "${data.team_name}", commissioned by ${data.company_name}.`
        ];
    } else if (data.cert_type === "LOE") {
        bodyLines = [
            `has demonstrated professional competency while working on the project`,
            `"${data.project_title}" as a member of Team "${data.team_name}",`,
            `under the supervision of ${data.company_name}.`
        ];
    } else {
        bodyLines = [
            `has completed and delivered the project "${data.project_title}"`,
            `as part of Team "${data.team_name}", for ${data.company_name}.`,
            `This certificate confirms successful project completion.`
        ];
    }
    bodyLines.forEach((line, i)=>{
        const lineWidth = helvetica.widthOfTextAtSize(line, 13);
        page.drawText(line, {
            x: (width - lineWidth) / 2,
            y: bodyY - 80 - i * 22,
            size: 13,
            font: helvetica,
            color: darkText
        });
    });
    // === FOOTER ===
    const footerY = 90;
    // Date
    const dateStr = `Issued: ${data.issue_date}`;
    page.drawText(dateStr, {
        x: 80,
        y: footerY,
        size: 11,
        font: helvetica,
        color: lightText
    });
    // Signature placeholder
    const sigText = "Authorized Signatory";
    const sigWidth = timesItalic.widthOfTextAtSize(sigText, 12);
    page.drawLine({
        start: {
            x: width - 80 - sigWidth - 20,
            y: footerY + 15
        },
        end: {
            x: width - 80,
            y: footerY + 15
        },
        thickness: 1,
        color: darkText
    });
    page.drawText(sigText, {
        x: width - 80 - sigWidth,
        y: footerY,
        size: 12,
        font: timesItalic,
        color: lightText
    });
    // Platform credit
    const creditText = "Powered by Paryuktam — Real Projects. Real Experience.";
    const creditWidth = helvetica.widthOfTextAtSize(creditText, 9);
    page.drawText(creditText, {
        x: (width - creditWidth) / 2,
        y: 50,
        size: 9,
        font: helvetica,
        color: lightText
    });
    return await doc.save();
}
}),
"[project]/src/app/api/projects/accept-team/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$jwt$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/jwt/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/index.mjs [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$generateCertificate$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/generateCertificate.ts [app-route] (ecmascript)");
;
;
;
;
const supabaseAdmin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(("TURBOPACK compile-time value", "https://qbvdtcejdjrdhuqdlawu.supabase.co"), process.env.SUPABASE_SERVICE_ROLE_KEY);
async function POST(req) {
    try {
        // 1. AUTH CHECK
        const token = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$jwt$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getToken"])({
            req
        });
        if (!token?.email) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Unauthorized"
            }, {
                status: 401
            });
        }
        const { project_id, team_id } = await req.json();
        if (!project_id || !team_id) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "project_id and team_id are required"
            }, {
                status: 400
            });
        }
        // 2. RESOLVE COMPANY USER
        const { data: companyProfile } = await supabaseAdmin.from("profiles").select("id, full_name").eq("email", token.email).maybeSingle();
        if (!companyProfile) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Company profile not found"
            }, {
                status: 404
            });
        }
        // 3. VERIFY COMPANY OWNERSHIP
        const { data: project } = await supabaseAdmin.from("projects").select("id, title, company_id").eq("id", project_id).maybeSingle();
        if (!project) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Project not found"
            }, {
                status: 404
            });
        }
        if (project.company_id !== companyProfile.id) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "You do not own this project"
            }, {
                status: 403
            });
        }
        // 4. VALIDATE APPLICATION STATUS (must be Shortlisted)
        const { data: application } = await supabaseAdmin.from("applications").select("id, status").eq("project_id", project_id).eq("team_id", team_id).maybeSingle();
        if (!application) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "No application found for this team/project"
            }, {
                status: 404
            });
        }
        const acceptableStatuses = [
            "shortlisted",
            "Shortlisted"
        ];
        if (!acceptableStatuses.includes(application.status)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: `Application must be Shortlisted to accept. Current status: ${application.status}`
            }, {
                status: 400
            });
        }
        // 5. STEP 1 — Update application status to "Accepted"
        const { error: updateErr } = await supabaseAdmin.from("applications").update({
            status: "Accepted"
        }).eq("id", application.id);
        if (updateErr) {
            console.error("Application update error:", updateErr);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Failed to accept team"
            }, {
                status: 500
            });
        }
        // 6. STEP 2 — Fetch all team members
        const { data: teamMembers, error: membersErr } = await supabaseAdmin.from("team_members").select("user_id").eq("team_id", team_id);
        if (membersErr || !teamMembers || teamMembers.length === 0) {
            // ROLLBACK: Revert application status
            await supabaseAdmin.from("applications").update({
                status: "shortlisted"
            }).eq("id", application.id);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "No team members found. Acceptance rolled back."
            }, {
                status: 400
            });
        }
        // Resolve team name
        const { data: team } = await supabaseAdmin.from("teams").select("name").eq("id", team_id).maybeSingle();
        const teamName = team?.name || "Team";
        const companyName = companyProfile.full_name || "Company";
        const issueDate = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
        // 7. STEP 3 — Generate certificates for EACH member (3 per user)
        // Resolve student names
        const memberUserIds = teamMembers.map((m)=>m.user_id);
        const { data: memberProfiles } = await supabaseAdmin.from("profiles").select("id, full_name, email").in("id", memberUserIds);
        const profileMap = {};
        (memberProfiles || []).forEach((p)=>{
            profileMap[p.id] = {
                name: p.full_name || p.email || "Student",
                email: p.email
            };
        });
        const certTypes = [
            "Participation",
            "LOE",
            "Confirmation"
        ];
        const certRows = [];
        const uploadPromises = [];
        for (const member of teamMembers){
            const studentName = profileMap[member.user_id]?.name || "Student";
            for (const certType of certTypes){
                // Generate PDF
                const pdfBytes = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$generateCertificate$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["generateCertificatePDF"])({
                    student_name: studentName,
                    team_name: teamName,
                    project_title: project.title,
                    company_name: companyName,
                    cert_type: certType,
                    issue_date: issueDate
                });
                // Upload to Supabase Storage (private bucket)
                const storagePath = `${project_id}/${team_id}/${member.user_id}/${certType.toLowerCase()}.pdf`;
                const uploadPromise = supabaseAdmin.storage.from("certificates").upload(storagePath, Buffer.from(pdfBytes), {
                    contentType: "application/pdf",
                    upsert: true
                }).then(({ error: uploadErr })=>{
                    if (uploadErr) {
                        console.error(`Upload error for ${storagePath}:`, uploadErr);
                    }
                });
                uploadPromises.push(uploadPromise);
                // Generate signed URL (valid for 30 days)
                const { data: signedUrlData } = await supabaseAdmin.storage.from("certificates").createSignedUrl(storagePath, 60 * 60 * 24 * 30);
                // Optional short unique base
                const shortProjectId = String(project_id).split('-')[0] || String(project_id).substring(0, 8);
                const shortUserId = String(member.user_id).split('-')[0] || String(member.user_id).substring(0, 8);
                certRows.push({
                    user_id: member.user_id,
                    project_id: project_id,
                    team_id: team_id,
                    certificate_code: `CERT-${shortProjectId}-${shortUserId}-${certType.toUpperCase().replace(/\s/g, "")}`,
                    type: certType,
                    issue_date: new Date().toISOString(),
                    download_url: signedUrlData?.signedUrl || null
                });
            }
        }
        // Wait for all uploads to complete (won't throw if one fails)
        await Promise.allSettled(uploadPromises);
        // 8. BULK INSERT certificates (single query)
        let certsGenerated = 0;
        if (certRows.length > 0) {
            const { error: certInsertErr } = await supabaseAdmin.from("certificates").insert(certRows);
            if (certInsertErr) {
                console.error("Certificate insert error (soft fail, application remains accepted):", certInsertErr);
            } else {
                certsGenerated = certRows.length;
            }
        }
        // 9. Update project status to in_progress & reject other applications
        await supabaseAdmin.from("projects").update({
            status: "in_progress"
        }).eq("id", project_id);
        await supabaseAdmin.from("applications").update({
            status: "Rejected"
        }).eq("project_id", project_id).neq("id", application.id);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            message: "Team Accepted and Certificates Issued.",
            team_id,
            certificates_generated: certsGenerated
        });
    } catch (error) {
        console.error("Accept Team Error:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Internal Server Error"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__c0b2b77f._.js.map