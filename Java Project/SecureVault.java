import javax.crypto.Cipher;
import javax.crypto.CipherInputStream;
import javax.crypto.CipherOutputStream;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.*;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.nio.file.InvalidPathException;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

public class SecureVault {
    // ===== Vault configuration =====
    private static final String VAULT_DIR_NAME = "SecureVault";          // under user.home
    private static final String META_FILE_NAME  = "vault.properties";    // properties file
    private static final String VAULT_EXT       = ".sv";                 // encrypted file extension

    // ===== Crypto configuration =====
    private static final int PBKDF2_ITERATIONS = 200_000; // strong but still quick on modern CPUs
    private static final int SALT_BYTES        = 16;      // for master password hashing
    private static final int KEY_BYTES         = 32;      // 256-bit AES key
    private static final int GCM_IV_BYTES      = 12;      // recommended for GCM
    private static final int GCM_TAG_BITS      = 128;     // 16 bytes tag

    // ===== File header (per item) =====
    private static final byte[] MAGIC = new byte[]{'S','V','L','T'}; // magic bytes
    private static final byte VERSION = 1;                            // header version

    // ===== Lockout policy =====
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCKOUT_MILLIS     = 60_000L; // 1 minute lock after too many failures

    // ===== Utilities =====
    private static final SecureRandom RNG = new SecureRandom();
    private static final DateTimeFormatter TS_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
            .withZone(ZoneId.systemDefault());

    public static void main(String[] args) {
        try {
            System.out.println("=== SecureVault - Encrypted File Storage ===");
            System.out.println("A secure, offline file encryption and storage application");
            System.out.println();
            
            Path vaultDir = ensureVaultDir();
            Properties meta = loadMeta(vaultDir);

            if (!meta.containsKey("hash")) {
                System.out.println("=== First-time setup ===");
                char[] pw1 = promptPassword("Create master password");
                char[] pw2 = promptPassword("Confirm master password");
                if (!Arrays.equals(pw1, pw2)) {
                    System.err.println("Passwords do not match. Exiting.");
                    clearPassword(pw1);
                    clearPassword(pw2);
                    return;
                }
                byte[] salt = new byte[SALT_BYTES];
                RNG.nextBytes(salt);
                byte[] hash = pbkdf2(pw1, salt, PBKDF2_ITERATIONS, KEY_BYTES);
                clearPassword(pw2);
                saveMeta(meta, vaultDir, salt, hash, PBKDF2_ITERATIONS, 0, 0L);
                clearPassword(pw1);
                System.out.println("Master password set. Vault initialized at: " + vaultDir);
            }

            // Check lockout
            long lockUntil = Long.parseLong(meta.getProperty("lockUntil", "0"));
            long now = System.currentTimeMillis();
            if (now < lockUntil) {
                long seconds = (lockUntil - now + 999) / 1000;
                System.err.println("Vault is temporarily locked due to failed attempts. Try again in " + seconds + "s.");
                return;
            }

            // Authenticate
            char[] pw = promptPassword("Enter master password");
            byte[] salt = Base64.getDecoder().decode(meta.getProperty("salt"));
            int iters = Integer.parseInt(meta.getProperty("iters"));
            byte[] expectedHash = Base64.getDecoder().decode(meta.getProperty("hash"));
            byte[] actualHash = pbkdf2(pw, salt, iters, KEY_BYTES);
            boolean ok = MessageDigest.isEqual(expectedHash, actualHash);
            clearPassword(pw);
            
            if (!ok) {
                int failed = Integer.parseInt(meta.getProperty("failed", "0")) + 1;
                long nextLock = failed >= MAX_FAILED_ATTEMPTS ? now + LOCKOUT_MILLIS : 0L;
                saveMeta(meta, vaultDir, salt, expectedHash, iters, failed, nextLock);
                System.err.println("Incorrect password. Failed attempts: " + failed + (nextLock > 0 ? " (vault locked for 60s)" : ""));
                return;
            } else {
                // reset failed/lock
                saveMeta(meta, vaultDir, salt, expectedHash, iters, 0, 0L);
            }

            SecretKeySpec masterKey = new SecretKeySpec(actualHash, "AES"); // derived key
            System.out.println("\n=== Login successful ===");
            System.out.println("Vault directory: " + vaultDir.toAbsolutePath());

            // Command loop with proper Scanner handling
            Scanner sc = new Scanner(System.in);
            try {
                while (true) {
                    System.out.println("\n=== Main Menu ===");
                    System.out.println("1) Add (encrypt) file");
                    System.out.println("2) List files");
                    System.out.println("3) Extract (decrypt) file");
                    System.out.println("4) Delete file (secure wipe)");
                    System.out.println("5) Change master password");
                    System.out.println("0) Exit");
                    System.out.print("Your choice: ");
                    
                    String choice = sc.nextLine().trim();
                    
                    switch (choice) {
                        case "1":
                            while (true) {
                                System.out.print("Path of the file to encrypt (or 'cancel' to return to menu): ");
                                System.out.flush();
                                String srcPath = sc.nextLine().trim();
                                
                                if (srcPath.equalsIgnoreCase("cancel")) {
                                    break;
                                }
                                
                                if (srcPath.isEmpty()) {
                                    System.err.println("Please enter a file path or 'cancel' to return to menu.");
                                    continue;
                                }
                                
                                try {
                                    Path src = Paths.get(srcPath).toAbsolutePath();
                                    if (!Files.exists(src)) {
                                        System.err.println("File does not exist: " + src);
                                        System.err.println("Please check the path and try again.");
                                        continue;
                                    }
                                    if (!Files.isRegularFile(src)) {
                                        System.err.println("Path is not a regular file: " + src);
                                        continue;
                                    }
                                    // File is valid, proceed with encryption
                                    addFileToVault(vaultDir, masterKey, src, sc);
                                    break;
                                } catch (InvalidPathException e) {
                                    System.err.println("Invalid file path format: " + srcPath);
                                    System.err.println("Please enter a valid file path.");
                                    continue;
                                }
                            }
                            break;
                            
                        case "2":
                            listVault(vaultDir);
                            break;
                            
                        case "3":
                            listVault(vaultDir);
                            System.out.print("Vault item name to extract (from list above): ");
                            String item = sc.nextLine().trim();
                            if (item.isEmpty()) {
                                System.err.println("No item name provided.");
                                break;
                            }
                            System.out.print("Output directory (or press Enter for current directory): ");
                            String outDirPath = sc.nextLine().trim();
                            Path outDir = outDirPath.isEmpty() ? 
                                Paths.get(".").toAbsolutePath() : 
                                Paths.get(outDirPath).toAbsolutePath();
                            
                            if (!Files.exists(outDir)) {
                                try {
                                    Files.createDirectories(outDir);
                                } catch (IOException e) {
                                    System.err.println("Could not create output directory: " + e.getMessage());
                                    break;
                                }
                            }
                            extractFromVault(vaultDir, masterKey, item, outDir);
                            break;
                            
                        case "4":
                            listVault(vaultDir);
                            System.out.print("Vault item name to DELETE (from list above): ");
                            String del = sc.nextLine().trim();
                            if (del.isEmpty()) {
                                System.err.println("No item name provided.");
                                break;
                            }
                            System.out.print("Are you sure you want to permanently delete '" + del + "'? (yes/no): ");
                            String confirm = sc.nextLine().trim().toLowerCase();
                            if (confirm.equals("yes") || confirm.equals("y")) {
                                deleteFromVault(vaultDir, del);
                            } else {
                                System.out.println("Delete operation cancelled.");
                            }
                            break;
                            
                        case "5":
                            changeMasterPassword(vaultDir, meta, masterKey);
                            // update masterKey reference after change
                            meta = loadMeta(vaultDir);
                            byte[] newHash = Base64.getDecoder().decode(meta.getProperty("hash"));
                            masterKey = new SecretKeySpec(newHash, "AES");
                            break;
                            
                        case "0":
                            System.out.println("Goodbye! Your files remain securely encrypted.");
                            return;
                            
                        default:
                            System.err.println("Invalid option. Please choose 0-5.");
                    }
                }
            } finally {
                sc.close();
            }
        } catch (Exception e) {
            System.err.println("Fatal error: " + e.getMessage());
            e.printStackTrace(System.err);
        }
    }

    // ===== Core actions =====

    private static void addFileToVault(Path vaultDir, SecretKeySpec key, Path src, Scanner sc) 
            throws IOException, GeneralSecurityException {
        String baseName = src.getFileName().toString();
        String timestamp = String.valueOf(System.currentTimeMillis());
        String vaultName = sanitizeName(baseName + "_" + timestamp) + VAULT_EXT;
        Path dest = vaultDir.resolve(vaultName);

        long fileSize = Files.size(src);
        System.out.println("File to encrypt: " + baseName + " (" + formatFileSize(fileSize) + ")");
        
        byte[] iv = new byte[GCM_IV_BYTES];
        RNG.nextBytes(iv);

        try (InputStream in = Files.newInputStream(src);
             OutputStream rawOut = Files.newOutputStream(dest, StandardOpenOption.CREATE_NEW);
             BufferedOutputStream bout = new BufferedOutputStream(rawOut)) {

            // Write header: MAGIC(4) | VERSION(1) | IV(12) | nameLen(2) | name | size(8)
            bout.write(MAGIC);
            bout.write(VERSION);
            bout.write(iv);
            byte[] nameBytes = baseName.getBytes(StandardCharsets.UTF_8);
            if (nameBytes.length > 65535) throw new IOException("Filename too long");
            bout.write(ByteBuffer.allocate(2).putShort((short) nameBytes.length).array());
            bout.write(nameBytes);
            long origSize = Files.size(src);
            bout.write(ByteBuffer.allocate(8).putLong(origSize).array());

            // Encrypt stream (AES/GCM/NoPadding)
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_BITS, iv));

            try (CipherOutputStream cout = new CipherOutputStream(bout, cipher)) {
                copy(in, cout);
            }
        }

        System.out.println("Successfully encrypted and added to vault: " + baseName + " -> " + dest.getFileName());
        
        // Ask if user wants to securely delete the original
        System.out.print("Do you want to securely delete the original file? (yes/no): ");
        String deleteOrig = sc.nextLine().trim().toLowerCase();
        if (deleteOrig.equals("yes") || deleteOrig.equals("y")) {
            secureDeleteFile(src);
            System.out.println("Original file securely deleted.");
        }
    }

    private static void listVault(Path vaultDir) throws IOException {
        System.out.println("\n=== Vault Contents ===");
        try (DirectoryStream<Path> ds = Files.newDirectoryStream(vaultDir, "*" + VAULT_EXT)) {
            int count = 0;
            for (Path p : ds) {
                try (InputStream in = Files.newInputStream(p)) {
                    VaultHeader hdr = readHeader(in);
                    String ts = TS_FMT.format(Instant.ofEpochMilli(Files.getLastModifiedTime(p).toMillis()));
                    System.out.printf(Locale.ROOT, "%-32s  |  %-25s  |  %10s  |  %s%n",
                            p.getFileName().toString(), hdr.originalName, 
                            formatFileSize(hdr.originalSize), ts);
                    count++;
                } catch (Exception e) {
                    System.out.println(p.getFileName() + "  |  <invalid/corrupt>");
                }
            }
            if (count == 0) {
                System.out.println("(vault is empty)");
            } else {
                System.out.println("Total items: " + count);
            }
        }
    }

    private static void extractFromVault(Path vaultDir, SecretKeySpec key, String vaultItemName, Path outDir)
            throws IOException, GeneralSecurityException {
        Path src = vaultDir.resolve(vaultItemName);
        if (!Files.exists(src)) {
            System.err.println("No such vault item: " + vaultItemName);
            return;
        }
        
        try (InputStream rawIn = Files.newInputStream(src);
             BufferedInputStream bin = new BufferedInputStream(rawIn)) {

            VaultHeader hdr = readHeader(bin);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_BITS, hdr.iv));

            Path out = outDir.resolve(hdr.originalName);
            // ensure unique filename if exists
            out = uniquePath(out);

            try (CipherInputStream cin = new CipherInputStream(bin, cipher);
                 OutputStream outFile = Files.newOutputStream(out, StandardOpenOption.CREATE_NEW)) {
                copy(cin, outFile);
            }
            System.out.println("Successfully extracted to: " + out.toAbsolutePath());
            System.out.println("Original file size: " + formatFileSize(hdr.originalSize));
        } catch (GeneralSecurityException e) {
            System.err.println("Decryption failed. File may be corrupted or password incorrect.");
            throw e;
        }
    }

    private static void deleteFromVault(Path vaultDir, String vaultItemName) throws IOException {
        Path target = vaultDir.resolve(vaultItemName);
        if (!Files.exists(target)) {
            System.err.println("No such vault item: " + vaultItemName);
            return;
        }
        
        secureDeleteFile(target);
        System.out.println("Securely deleted: " + vaultItemName);
    }

    private static void changeMasterPassword(Path vaultDir, Properties meta, SecretKeySpec oldKey) throws Exception {
        System.out.println("\n=== Change Master Password ===");
        char[] current = promptPassword("Enter current password");
        byte[] salt = Base64.getDecoder().decode(meta.getProperty("salt"));
        int iters = Integer.parseInt(meta.getProperty("iters"));
        byte[] expectedHash = Base64.getDecoder().decode(meta.getProperty("hash"));
        byte[] check = pbkdf2(current, salt, iters, KEY_BYTES);
        clearPassword(current);
        
        if (!MessageDigest.isEqual(expectedHash, check)) {
            System.err.println("Wrong current password.");
            return;
        }
        
        char[] pw1 = promptPassword("New password");
        char[] pw2 = promptPassword("Confirm new password");
        if (!Arrays.equals(pw1, pw2)) {
            System.err.println("Passwords do not match.");
            clearPassword(pw1);
            clearPassword(pw2);
            return;
        }
        
        byte[] newSalt = new byte[SALT_BYTES];
        RNG.nextBytes(newSalt);
        byte[] newHash = pbkdf2(pw1, newSalt, PBKDF2_ITERATIONS, KEY_BYTES);
        clearPassword(pw1);
        clearPassword(pw2);
        
        saveMeta(meta, vaultDir, newSalt, newHash, PBKDF2_ITERATIONS, 0, 0L);
        System.out.println("Master password changed successfully. Existing vault items remain accessible.");
    }

    // ===== Header handling =====
    private static class VaultHeader {
        byte[] iv;
        String originalName;
        long originalSize;
    }

    private static VaultHeader readHeader(InputStream in) throws IOException {
        byte[] magic = in.readNBytes(4);
        if (!Arrays.equals(magic, MAGIC)) throw new IOException("Bad magic - not a valid vault file");
        int ver = in.read();
        if (ver != VERSION) throw new IOException("Unsupported version: " + ver);
        byte[] iv = in.readNBytes(GCM_IV_BYTES);
        byte[] nameLenBytes = in.readNBytes(2);
        int nameLen = ByteBuffer.wrap(nameLenBytes).getShort() & 0xFFFF;
        byte[] nameBytes = in.readNBytes(nameLen);
        byte[] sizeBytes = in.readNBytes(8);
        long size = ByteBuffer.wrap(sizeBytes).getLong();
        VaultHeader hdr = new VaultHeader();
        hdr.iv = iv;
        hdr.originalName = new String(nameBytes, StandardCharsets.UTF_8);
        hdr.originalSize = size;
        return hdr;
    }

    // ===== Meta (properties) handling =====
    private static Properties loadMeta(Path vaultDir) throws IOException {
        Properties p = new Properties();
        Path metaPath = vaultDir.resolve(META_FILE_NAME);
        if (Files.exists(metaPath)) {
            try (InputStream in = Files.newInputStream(metaPath)) { 
                p.load(in); 
            }
        }
        return p;
    }

    private static void saveMeta(Properties meta, Path vaultDir, byte[] salt, byte[] hash, int iters, int failed, long lockUntil) throws IOException {
        meta.setProperty("salt", Base64.getEncoder().encodeToString(salt));
        meta.setProperty("hash", Base64.getEncoder().encodeToString(hash));
        meta.setProperty("iters", String.valueOf(iters));
        meta.setProperty("failed", String.valueOf(failed));
        meta.setProperty("lockUntil", String.valueOf(lockUntil));
        Path metaPath = vaultDir.resolve(META_FILE_NAME);
        try (OutputStream out = Files.newOutputStream(metaPath)) {
            meta.store(out, "SecureVault metadata – DO NOT SHARE");
        }
    }

    // ===== Helpers =====
    private static Path ensureVaultDir() throws IOException {
        Path home = Paths.get(System.getProperty("user.home"));
        Path dir = home.resolve(VAULT_DIR_NAME);
        if (!Files.exists(dir)) {
            Files.createDirectories(dir);
            System.out.println("Created vault directory: " + dir);
        }
        return dir;
    }

    private static char[] promptPassword(String prompt) throws IOException {
        Console c = System.console();
        if (c != null) {
            char[] pw = c.readPassword("%s: ", prompt);
            return pw == null ? new char[0] : pw;
        } else {
            // Fallback if no console (e.g., IDE). Input will be visible.
            System.out.print(prompt + " (WARNING: password will be visible): ");
            try (BufferedReader br = new BufferedReader(new InputStreamReader(System.in))) {
                String s = br.readLine();
                return s == null ? new char[0] : s.toCharArray();
            }
        }
    }

    private static byte[] pbkdf2(char[] password, byte[] salt, int iters, int keyLen) {
        try {
            PBEKeySpec spec = new PBEKeySpec(password, salt, iters, keyLen * 8);
            SecretKeyFactory skf = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            return skf.generateSecret(spec).getEncoded();
        } catch (GeneralSecurityException e) {
            throw new RuntimeException(e);
        }
    }

    private static void copy(InputStream in, OutputStream out) throws IOException {
        byte[] buf = new byte[8192];
        int n;
        while ((n = in.read(buf)) != -1) {
            out.write(buf, 0, n);
        }
    }

    private static String sanitizeName(String s) {
        return s.replaceAll("[^A-Za-z0-9._-]", "_");
    }

    private static Path uniquePath(Path p) throws IOException {
        if (!Files.exists(p)) return p;
        String name = p.getFileName().toString();
        String base; String ext;
        int dot = name.lastIndexOf('.');
        if (dot >= 0) { 
            base = name.substring(0, dot); 
            ext = name.substring(dot); 
        } else { 
            base = name; 
            ext = ""; 
        }
        int i = 1;
        Path parent = p.getParent();
        while (true) {
            Path cand = parent.resolve(base + "(" + i + ")" + ext);
            if (!Files.exists(cand)) return cand;
            i++;
        }
    }
    
    private static void clearPassword(char[] password) {
        if (password != null) {
            Arrays.fill(password, '\0');
        }
    }
    
    private static void secureDeleteFile(Path file) throws IOException {
        long size = Files.size(file);
        try (RandomAccessFile raf = new RandomAccessFile(file.toFile(), "rw")) {
            // Overwrite with random data multiple times
            byte[] buf = new byte[8192];
            for (int pass = 0; pass < 3; pass++) {
                raf.seek(0);
                long remaining = size;
                while (remaining > 0) {
                    RNG.nextBytes(buf);
                    int n = (int) Math.min(buf.length, remaining);
                    raf.write(buf, 0, n);
                    remaining -= n;
                }
                raf.getFD().sync(); // force write to disk
            }
        }
        Files.delete(file);
    }
    
    private static String formatFileSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024));
        return String.format("%.1f GB", bytes / (1024.0 * 1024 * 1024));
    }
}