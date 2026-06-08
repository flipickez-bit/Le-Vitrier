<?php
/* ===========================================================
   Le Vitrier — gestionnaire du formulaire de contact
   → email vers levitrier06@gmail.com
   → indique la catégorie (Particulier, Pro, etc.)
   → accepte les photos en pièces jointes
   Hébergé sur Hostinger (aucune dépendance externe)
   =========================================================== */

if (!empty($_POST['website'])) { header('Location: merci.html'); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { header('Location: index.html'); exit; }

function lv_clean($s) { return trim(str_replace(array("\r", "\n"), ' ', $s)); }

$nom       = isset($_POST['nom'])       ? lv_clean($_POST['nom'])       : '';
$telephone = isset($_POST['telephone']) ? lv_clean($_POST['telephone']) : '';
$email     = isset($_POST['email'])     ? lv_clean($_POST['email'])     : '';
$message   = isset($_POST['message'])   ? trim($_POST['message'])       : '';
$categorie = isset($_POST['categorie']) ? lv_clean($_POST['categorie']) : 'Général';

if ($nom === '' || $telephone === '' || $message === '') {
  http_response_code(400);
  echo 'Merci de remplir votre nom, votre téléphone et votre message.';
  exit;
}

$to      = 'levitrier06@gmail.com';
$subject = 'Demande de devis [' . $categorie . '] - levitrier06.fr';

$body  = "Nouvelle demande depuis le site levitrier06.fr\n";
$body .= "----------------------------------------\n\n";
$body .= "Catégorie : " . $categorie . "\n";
$body .= "Nom       : " . $nom . "\n";
$body .= "Téléphone : " . $telephone . "\n";
$body .= "Email     : " . ($email !== '' ? $email : 'non renseigné') . "\n\n";
$body .= "Message :\n" . $message . "\n";

/* ── Pièces jointes (photos) ── */
$attachments = array();
if (!empty($_FILES['photos']) && is_array($_FILES['photos']['name'])) {
  $allowed = array('image/jpeg', 'image/pjpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif');
  $maxSize = 12 * 1024 * 1024; // 12 Mo par photo
  $count   = count($_FILES['photos']['name']);
  for ($i = 0; $i < $count && count($attachments) < 6; $i++) {
    if ($_FILES['photos']['error'][$i] !== UPLOAD_ERR_OK) continue;
    $tmp  = $_FILES['photos']['tmp_name'][$i];
    if (!is_uploaded_file($tmp)) continue;
    $size = (int) $_FILES['photos']['size'][$i];
    if ($size <= 0 || $size > $maxSize) continue;
    $type = function_exists('mime_content_type') ? @mime_content_type($tmp) : '';
    if ($type && !in_array($type, $allowed)) continue;
    $data = @file_get_contents($tmp);
    if ($data === false) continue;
    $name = preg_replace('/[^\w.\-]/', '_', basename($_FILES['photos']['name'][$i]));
    if ($name === '') { $name = 'photo_' . ($i + 1) . '.jpg'; }
    $attachments[] = array('name' => $name, 'type' => ($type ?: 'application/octet-stream'), 'data' => $data);
  }
}
if (count($attachments) > 0) {
  $body .= "\n" . count($attachments) . " photo(s) jointe(s).\n";
}

$subjectEnc = '=?UTF-8?B?' . base64_encode($subject) . '?=';

$replyTo = '';
if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
  $replyTo = "Reply-To: " . $email . "\r\n";
}

if (count($attachments) === 0) {
  /* Email simple */
  $headers  = "From: Le Vitrier <no-reply@levitrier06.fr>\r\n";
  $headers .= $replyTo;
  $headers .= "MIME-Version: 1.0\r\n";
  $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
  $ok = @mail($to, $subjectEnc, $body, $headers);
} else {
  /* Email multipart avec pièces jointes */
  $boundary = '=_lv_' . md5(uniqid((string) time(), true));
  $headers  = "From: Le Vitrier <no-reply@levitrier06.fr>\r\n";
  $headers .= $replyTo;
  $headers .= "MIME-Version: 1.0\r\n";
  $headers .= "Content-Type: multipart/mixed; boundary=\"" . $boundary . "\"\r\n";

  $msg  = "--" . $boundary . "\r\n";
  $msg .= "Content-Type: text/plain; charset=UTF-8\r\n";
  $msg .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
  $msg .= $body . "\r\n";

  foreach ($attachments as $att) {
    $msg .= "--" . $boundary . "\r\n";
    $msg .= "Content-Type: " . $att['type'] . "; name=\"" . $att['name'] . "\"\r\n";
    $msg .= "Content-Transfer-Encoding: base64\r\n";
    $msg .= "Content-Disposition: attachment; filename=\"" . $att['name'] . "\"\r\n\r\n";
    $msg .= chunk_split(base64_encode($att['data'])) . "\r\n";
  }
  $msg .= "--" . $boundary . "--";

  $ok = @mail($to, $subjectEnc, $msg, $headers);
}

if ($ok) { header('Location: merci.html'); exit; }

http_response_code(500);
echo "Une erreur est survenue lors de l'envoi. Appelez-nous directement au 06 77 30 30 65.";
exit;
