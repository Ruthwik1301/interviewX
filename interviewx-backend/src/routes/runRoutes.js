import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { env } from "../config/env.js";

const router = Router();
router.use(requireAuth);

// JDoodle language IDs and version indexes
// Full list: https://www.jdoodle.com/compiler-api/
const JDOODLE_LANG = {
  javascript: { language: "nodejs", versionIndex: "4" },
  python: { language: "python3", versionIndex: "4" },
  java: { language: "java", versionIndex: "4" },
  cpp: { language: "cpp17", versionIndex: "1" },
  typescript: { language: "typescript", versionIndex: "1" },
  go: { language: "go", versionIndex: "4" },
};

router.post("/", async (req, res, next) => {
  try {
    const { code, languageId } = req.body;

    if (!code || !languageId) {
      return res
        .status(400)
        .json({ error: "code and languageId are required." });
    }

    const lang = JDOODLE_LANG[languageId];
    if (!lang) {
      return res
        .status(400)
        .json({ error: `Unsupported language: ${languageId}` });
    }

    if (!env.jdoodleClientId || !env.jdoodleClientSecret) {
      return res.status(503).json({
        error:
          "Code execution is not configured. " +
          "Add JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET to your .env file. " +
          "Get free credentials at jdoodle.com/compiler-api",
      });
    }

    const jdoodleRes = await fetch("https://api.jdoodle.com/v1/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: env.jdoodleClientId,
        clientSecret: env.jdoodleClientSecret,
        script: code,
        language: lang.language,
        versionIndex: lang.versionIndex,
        stdin: "",
      }),
    });

    const rawText = await jdoodleRes.text();
    console.log(
      "[runRoutes] JDoodle response:",
      jdoodleRes.status,
      rawText.slice(0, 300),
    );

    if (!jdoodleRes.ok) {
      return res.status(502).json({
        error: `Code execution failed (${jdoodleRes.status}): ${rawText.slice(0, 200)}`,
      });
    }

    const data = JSON.parse(rawText);
    const output = data.output ?? "";

    // JDoodle returns { output, statusCode, memory, cpuTime }
    // statusCode 200 just means "the API call worked" — it does NOT mean
    // the user's code ran without errors. JDoodle puts compile/runtime
    // errors directly in the `output` field, so we detect errors by pattern.
    const looksLikeError =
      /error|exception|traceback|syntaxerror|indentationerror|typeerror|nameerror|segmentation fault|panic:/i.test(
        output,
      ) ||
      data.isCompiled === false ||
      data.compilationStatus === "Failure";

    const exitCode = data.statusCode !== 200 || looksLikeError ? 1 : 0;
    const isError = exitCode !== 0;

    res.json({
      stdout: isError ? "" : output,
      stderr: isError ? output : "",
      compileErr: "",
      exitCode,
      memory: data.memory,
      cpuTime: data.cpuTime,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
