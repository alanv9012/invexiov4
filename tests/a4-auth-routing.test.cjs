// Run with node --test tests/a4-auth-routing.test.cjs. The tests load the real
// TypeScript modules with in-memory Supabase and Next.js dependencies only.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function load(path, mocks = {}) {
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(path, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX
    }
  }).outputText;

  vm.runInNewContext(source, {
    module,
    exports: module.exports,
    require(name) {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name === "zod") return require("zod");
      throw new Error(`Unexpected dependency: ${name}`);
    },
    FormData,
    URL,
    URLSearchParams
  }, { filename: path });

  return module.exports;
}

const accessMessages = load("src/features/auth/login-access-message.ts");
const urlToastMessages = load("src/components/ui/toast/url-toast-message.ts");

function runUrlToastListener(urlValue) {
  const url = new URL(urlValue);
  const calls = [];
  const listener = load("src/components/ui/toast/url-toast-listener.tsx", {
    react: {
      useEffect(callback) {
        callback();
      },
      useRef(initialValue) {
        return { current: initialValue };
      }
    },
    "next/navigation": {
      usePathname: () => url.pathname,
      useRouter: () => ({
        replace(destination, options) {
          calls.push(["replace", destination, options]);
        }
      }),
      useSearchParams: () => url.searchParams
    },
    "@/components/ui/toast/toast-context": {
      useToast: () => ({
        error(input) {
          calls.push(["error", input.message]);
        },
        success(input) {
          calls.push(["success", input.message]);
        }
      })
    },
    "@/components/ui/toast/url-toast-message": urlToastMessages
  });

  listener.UrlToastListener();
  return calls;
}

function validLoginForm() {
  const form = new FormData();
  form.set("email", "owner@example.test");
  form.set("password", "valid-password");
  return form;
}

function loadAuthActions({ profileData = true, profileError = null, profileThrows = false,
                           signOutError = null } = {}) {
  const calls = [];
  const supabase = {
    auth: {
      async signInWithPassword(credentials) {
        calls.push(["signInWithPassword", credentials]);
        return { error: null };
      },
      async signOut(options) {
        calls.push(["signOut", options]);
        return { error: signOutError };
      }
    },
    async rpc(name) {
      calls.push(["rpc", name]);
      if (profileThrows) throw new Error("profile check unavailable");
      return { data: profileData, error: profileError };
    }
  };
  const redirectError = new Error("NEXT_REDIRECT");
  redirectError.destination = null;
  const actions = load("src/features/auth/actions.ts", {
    "next/navigation": {
      redirect(destination) {
        redirectError.destination = destination;
        throw redirectError;
      }
    },
    "@/features/auth/login-access-message": accessMessages,
    "@/lib/supabase/server": { getSupabaseServerClient: async () => supabase }
  });

  return { actions, calls, redirectError };
}

test("successful active Owner login redirects and retains the session", async () => {
  const { actions, calls, redirectError } = loadAuthActions();

  await assert.rejects(actions.loginAction({}, validLoginForm()), error => error === redirectError);
  assert.equal(redirectError.destination, "/");
  assert.deepEqual(calls.map(([name]) => name), ["signInWithPassword", "rpc"]);
});

for (const accountState of ["inactive", "missing profile"]) {
  test(`${accountState} login is rejected and its local session is cleared`, async () => {
    const { actions, calls } = loadAuthActions({ profileData: false });

    const result = await actions.loginAction({}, validLoginForm());

    assert.equal(result.status, "error");
    assert.equal(result.message, accessMessages.INACTIVE_ACCESS_MESSAGE);
    assert.deepEqual(calls.map(([name]) => name), ["signInWithPassword", "rpc", "signOut"]);
    assert.equal(calls.at(-1)[1].scope, "local");
  });
}

test("profile-check failures clear the session and report temporary unavailability", async () => {
  const { actions, calls } = loadAuthActions({ profileThrows: true });

  const result = await actions.loginAction({}, validLoginForm());

  assert.equal(result.status, "error");
  assert.equal(result.message, accessMessages.ACCESS_UNAVAILABLE_MESSAGE);
  assert.deepEqual(calls.map(([name]) => name), ["signInWithPassword", "rpc", "signOut"]);
});

test("failed rejected-session cleanup is reported explicitly", async () => {
  const { actions } = loadAuthActions({ profileData: false, signOutError: new Error("cleanup failed") });

  const result = await actions.loginAction({}, validLoginForm());

  assert.equal(result.status, "error");
  assert.match(result.message, /Sign-out could not be confirmed/);
});

function makeResponse(type, url = null) {
  const storedCookies = [];
  return {
    type,
    url,
    cookies: {
      set(nameOrCookie, value, options) {
        const cookie = typeof nameOrCookie === "string"
          ? { name: nameOrCookie, value, ...options }
          : { ...nameOrCookie };
        const existingIndex = storedCookies.findIndex(item => item.name === cookie.name);
        if (existingIndex >= 0) storedCookies.splice(existingIndex, 1);
        storedCookies.push(cookie);
      },
      getAll() {
        return storedCookies.map(cookie => ({ ...cookie }));
      }
    }
  };
}

const NextResponse = {
  next(options) {
    const response = makeResponse("next");
    response.options = options;
    return response;
  },
  redirect(url) {
    return makeResponse("redirect", url.toString());
  }
};

function request(pathname) {
  const url = new URL(pathname, "https://invexio.test");
  url.clone = () => new URL(url.toString());
  const storedCookies = [];
  return {
    nextUrl: url,
    cookies: {
      getAll() {
        return storedCookies.map(cookie => ({ ...cookie }));
      },
      set(nameOrCookie, value) {
        const cookie = typeof nameOrCookie === "string"
          ? { name: nameOrCookie, value }
          : { ...nameOrCookie };
        const existingIndex = storedCookies.findIndex(item => item.name === cookie.name);
        if (existingIndex >= 0) storedCookies.splice(existingIndex, 1);
        storedCookies.push(cookie);
      }
    }
  };
}

function loadMiddleware({ envAvailable = true, user = null, profileData = false,
                          profileError = null, createClientThrows = false,
                          getUserThrows = false, getUserError = null, rpcThrows = false,
                          cookieBatchesOnGetUser = [] } = {}) {
  const calls = [];
  let cookieMethods = null;
  const supabase = {
    auth: {
      async getUser() {
        calls.push("getUser");
        if (getUserThrows) throw new Error("authentication unavailable");
        for (const batch of cookieBatchesOnGetUser) cookieMethods.setAll(batch);
        return { data: { user }, error: getUserError };
      }
    },
    async rpc(name) {
      calls.push(name);
      if (rpcThrows) throw new Error("profile check unavailable");
      return { data: profileData, error: profileError };
    }
  };
  const middleware = load("src/lib/supabase/middleware.ts", {
    "next/server": { NextResponse },
    "@supabase/ssr": {
      createServerClient(_url, _key, options) {
        calls.push("createServerClient");
        if (createClientThrows) throw new Error("client creation unavailable");
        cookieMethods = options.cookies;
        return supabase;
      }
    },
    "@/lib/supabase/env": {
      getPublicSupabaseEnv() {
        if (!envAvailable) throw new Error("missing environment");
        return {
          NEXT_PUBLIC_SUPABASE_URL: "https://local.test",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-anon-key"
        };
      }
    }
  });
  return { middleware, calls };
}

test("missing Supabase configuration fails closed on protected routes", async () => {
  const { middleware, calls } = loadMiddleware({ envAvailable: false });
  const response = await middleware.updateSession(request("/orders"));

  assert.equal(response.type, "redirect");
  assert.equal(new URL(response.url).pathname, "/login");
  assert.equal(new URL(response.url).searchParams.get("access"), "unavailable");
  assert.deepEqual(calls, []);
});

for (const route of ["/login", "/signup"]) {
  test(`missing configuration keeps public route ${route} reachable`, async () => {
    const { middleware } = loadMiddleware({ envAvailable: false });
    const response = await middleware.updateSession(request(route));
    assert.equal(response.type, "next");
  });
}

test("unauthenticated protected requests redirect to login", async () => {
  const { middleware } = loadMiddleware();
  const response = await middleware.updateSession(request("/products"));

  assert.equal(response.type, "redirect");
  assert.equal(new URL(response.url).pathname, "/login");
  assert.equal(new URL(response.url).searchParams.has("access"), false);
});

test("protected-route redirects discard unrelated query parameters", async () => {
  const { middleware } = loadMiddleware();
  const response = await middleware.updateSession(
    request("/orders?message=arbitrary-text&returnTo=https%3A%2F%2Fevil.test")
  );
  const redirected = new URL(response.url);

  assert.equal(redirected.pathname, "/login");
  assert.equal(redirected.search, "");
});

for (const accountState of ["inactive", "missing profile"]) {
  test(`${accountState} protected request redirects with an access-denied code`, async () => {
    const { middleware } = loadMiddleware({ user: { id: "user-id" }, profileData: false });
    const response = await middleware.updateSession(request("/"));

    assert.equal(response.type, "redirect");
    assert.equal(new URL(response.url).pathname, "/login");
    assert.equal(new URL(response.url).searchParams.get("access"), "inactive");
  });
}

test("profile-check errors redirect protected requests with an unavailable code", async () => {
  const { middleware } = loadMiddleware({
    user: { id: "user-id" },
    profileError: new Error("database unavailable")
  });
  const response = await middleware.updateSession(request("/settings"));

  assert.equal(response.type, "redirect");
  assert.equal(new URL(response.url).searchParams.get("access"), "unavailable");
});

for (const failure of ["createServerClient", "getUser", "is_active_user"]) {
  test(`${failure} exceptions fail closed without leaking details`, async () => {
    const options = failure === "createServerClient"
      ? { createClientThrows: true }
      : failure === "getUser"
        ? { getUserThrows: true }
        : { user: { id: "user-id" }, rpcThrows: true };
    const { middleware } = loadMiddleware(options);
    const response = await middleware.updateSession(request("/orders?error=internal-details"));
    const redirected = new URL(response.url);

    assert.equal(response.type, "redirect");
    assert.equal(redirected.pathname, "/login");
    assert.equal(redirected.searchParams.get("access"), "unavailable");
    assert.equal(redirected.searchParams.has("error"), false);
    assert.equal(redirected.searchParams.size, 1);
  });

  for (const route of ["/login", "/signup"]) {
    test(`${failure} exceptions leave public route ${route} reachable`, async () => {
      const options = failure === "createServerClient"
        ? { createClientThrows: true }
        : failure === "getUser"
          ? { getUserThrows: true }
          : { user: { id: "user-id" }, rpcThrows: true };
      const { middleware } = loadMiddleware(options);
      const response = await middleware.updateSession(request(route));
      assert.equal(response.type, "next");
    });
  }
}

test("authenticated redirects preserve every refreshed Supabase cookie and option", async () => {
  const cookieBatchesOnGetUser = [
    [{
      name: "sb-access-token",
      value: "new-access",
      options: { httpOnly: true, path: "/", sameSite: "lax" }
    }],
    [{
      name: "sb-refresh-token",
      value: "new-refresh",
      options: { httpOnly: true, path: "/", maxAge: 3600 }
    }]
  ];
  const { middleware } = loadMiddleware({
    user: { id: "owner-id" },
    profileData: true,
    cookieBatchesOnGetUser
  });
  const response = await middleware.updateSession(request("/login?error=arbitrary-text"));

  assert.equal(response.type, "redirect");
  assert.equal(new URL(response.url).pathname, "/");
  assert.equal(new URL(response.url).search, "");
  assert.deepEqual(response.cookies.getAll(), [
    { name: "sb-access-token", value: "new-access", httpOnly: true, path: "/", sameSite: "lax" },
    { name: "sb-refresh-token", value: "new-refresh", httpOnly: true, path: "/", maxAge: 3600 }
  ]);
});

test("protected redirects preserve refreshed Supabase cookies", async () => {
  const { middleware } = loadMiddleware({
    user: { id: "inactive-id" },
    profileData: false,
    cookieBatchesOnGetUser: [[{
      name: "sb-session",
      value: "refreshed",
      options: { httpOnly: true, secure: true, path: "/" }
    }]]
  });
  const response = await middleware.updateSession(request("/products?message=arbitrary-text"));

  assert.equal(new URL(response.url).searchParams.get("access"), "inactive");
  assert.deepEqual(response.cookies.getAll(), [
    { name: "sb-session", value: "refreshed", httpOnly: true, secure: true, path: "/" }
  ]);
});

test("active Owner requests reach protected routes and leave auth routes", async () => {
  const protectedMiddleware = loadMiddleware({ user: { id: "owner-id" }, profileData: true });
  const protectedResponse = await protectedMiddleware.middleware.updateSession(request("/orders"));
  assert.equal(protectedResponse.type, "next");

  const authMiddleware = loadMiddleware({ user: { id: "owner-id" }, profileData: true });
  const authResponse = await authMiddleware.middleware.updateSession(request("/login"));
  assert.equal(authResponse.type, "redirect");
  assert.equal(new URL(authResponse.url).pathname, "/");
});

test("login access messages are allowlisted", () => {
  assert.equal(accessMessages.getLoginAccessMessage("inactive"), accessMessages.INACTIVE_ACCESS_MESSAGE);
  assert.equal(accessMessages.getLoginAccessMessage("unavailable"), accessMessages.ACCESS_UNAVAILABLE_MESSAGE);
  assert.equal(accessMessages.getLoginAccessMessage("user-controlled text"), null);
});

test("direct login URL notifications use a strict allowlist", () => {
  const spoofed = new URL("https://invexio.test/login?error=arbitrary-text");
  assert.equal(
    urlToastMessages.getAllowedUrlToast(
      spoofed.searchParams.get("error"),
      spoofed.searchParams.get("message")
    ),
    null
  );

  const signedOut = new URL("https://invexio.test/login?message=Signed%20out");
  const allowed = urlToastMessages.getAllowedUrlToast(
    signedOut.searchParams.get("error"),
    signedOut.searchParams.get("message")
  );
  assert.equal(allowed.variant, "success");
  assert.equal(allowed.message, "Signed out");
});

test("direct login spoof text is removed without displaying a toast", () => {
  const calls = runUrlToastListener("https://invexio.test/login?error=arbitrary-text");
  assert.equal(JSON.stringify(calls), JSON.stringify([["replace", "/login", { scroll: false }]]));
});

test("allowlisted login notifications still display and are removed from the URL", () => {
  const calls = runUrlToastListener(
    "https://invexio.test/login?message=Signed%20out&preserved=value"
  );
  assert.equal(JSON.stringify(calls), JSON.stringify([
      ["success", "Signed out"],
      ["replace", "/login?preserved=value", { scroll: false }]
    ]));
});
