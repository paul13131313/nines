import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, password, username } = await req.json();

  if (!email || !password || !username) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }

  // Service Role Key でRLSをバイパスするクライアント
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ユーザーネーム重複チェック
  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("username", username.trim().toLowerCase())
    .single();

  if (existing) {
    return NextResponse.json({ error: "このユーザーネームは既に使われています" }, { status: 409 });
  }

  // ユーザー作成（メール確認なしで即時有効化）
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // プロフィール作成（RLSバイパス）
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .insert({
      id: authData.user.id,
      username: username.trim().toLowerCase(),
      display_name: username.trim(),
    });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({
    userId: authData.user.id,
    username: username.trim().toLowerCase(),
  });
}
