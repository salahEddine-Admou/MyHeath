using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace MyHeath.Api.Services;

/// <summary>
/// AES-256-CBC compatible with Node crypto.js (iv_hex:ciphertext_hex, SHA-256 key derivation).
/// </summary>
public class AesCryptoService
{
    private readonly byte[] _key;

    public AesCryptoService(IConfiguration config)
    {
        var secret = config["AES_SECRET_KEY"] ?? "0123456789abcdef0123456789abcdef";
        _key = SHA256.HashData(Encoding.UTF8.GetBytes(secret));
    }

    public string Encrypt(object? value)
    {
        if (value is null) return "";
        var plain = value is string s ? s : JsonSerializer.Serialize(value);
        var iv = RandomNumberGenerator.GetBytes(16);
        using var aes = Aes.Create();
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;
        aes.Key = _key;
        aes.IV = iv;
        using var enc = aes.CreateEncryptor();
        var plainBytes = Encoding.UTF8.GetBytes(plain);
        var cipher = enc.TransformFinalBlock(plainBytes, 0, plainBytes.Length);
        return $"{Convert.ToHexString(iv).ToLowerInvariant()}:{Convert.ToHexString(cipher).ToLowerInvariant()}";
    }

    public object? Decrypt(string? payload)
    {
        if (string.IsNullOrEmpty(payload) || !payload.Contains(':')) return payload;
        var parts = payload.Split(':', 2);
        var iv = Convert.FromHexString(parts[0]);
        var cipher = Convert.FromHexString(parts[1]);
        using var aes = Aes.Create();
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;
        aes.Key = _key;
        aes.IV = iv;
        using var dec = aes.CreateDecryptor();
        var plain = Encoding.UTF8.GetString(dec.TransformFinalBlock(cipher, 0, cipher.Length));
        try
        {
            return JsonSerializer.Deserialize<JsonElement>(plain);
        }
        catch
        {
            return plain;
        }
    }

    public string DecryptToString(string? payload)
    {
        var v = Decrypt(payload);
        return v switch
        {
            null => "",
            string s => s,
            JsonElement je when je.ValueKind == JsonValueKind.String => je.GetString() ?? "",
            JsonElement je => je.ToString(),
            _ => v.ToString() ?? ""
        };
    }
}
