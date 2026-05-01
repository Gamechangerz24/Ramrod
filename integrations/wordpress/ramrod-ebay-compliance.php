<?php
/**
 * Plugin Name: RAMROD eBay Compliance
 * Description: Provides RAMROD eBay OAuth placeholder and marketplace account deletion endpoints.
 * Version: 0.1.0
 * Author: Gamechangerz UG
 */

if (!defined('ABSPATH')) {
    exit;
}

const RAMROD_EBAY_OPTION_TOKEN = 'ramrod_ebay_verification_token';
const RAMROD_EBAY_OPTION_LOG = 'ramrod_ebay_last_account_deletion_notification';

register_activation_hook(__FILE__, 'ramrod_ebay_activate');
register_deactivation_hook(__FILE__, 'ramrod_ebay_deactivate');

add_action('init', 'ramrod_ebay_rewrite_rules');
add_filter('query_vars', 'ramrod_ebay_query_vars');
add_action('template_redirect', 'ramrod_ebay_template_redirect');
add_action('admin_menu', 'ramrod_ebay_admin_menu');
add_action('admin_init', 'ramrod_ebay_register_settings');

function ramrod_ebay_activate()
{
    ramrod_ebay_rewrite_rules();
    flush_rewrite_rules();
}

function ramrod_ebay_deactivate()
{
    flush_rewrite_rules();
}

function ramrod_ebay_rewrite_rules()
{
    add_rewrite_rule('^ramrod/ebay/account-deletion/?$', 'index.php?ramrod_ebay_endpoint=account_deletion', 'top');
    add_rewrite_rule('^ramrod/oauth/callback/?$', 'index.php?ramrod_ebay_endpoint=oauth_callback', 'top');
    add_rewrite_rule('^ramrod/oauth/declined/?$', 'index.php?ramrod_ebay_endpoint=oauth_declined', 'top');
}

function ramrod_ebay_query_vars($vars)
{
    $vars[] = 'ramrod_ebay_endpoint';
    return $vars;
}

function ramrod_ebay_template_redirect()
{
    $endpoint = get_query_var('ramrod_ebay_endpoint');

    if ($endpoint === 'account_deletion') {
        ramrod_ebay_account_deletion();
        exit;
    }

    if ($endpoint === 'oauth_callback') {
        ramrod_ebay_simple_page('RAMROD eBay Authorization', 'The eBay authorization step has returned to RAMROD. You can close this tab.');
        exit;
    }

    if ($endpoint === 'oauth_declined') {
        ramrod_ebay_simple_page('RAMROD eBay Authorization Declined', 'The eBay authorization request was declined or cancelled.');
        exit;
    }
}

function ramrod_ebay_account_deletion()
{
    $challenge_code = isset($_GET['challenge_code']) ? sanitize_text_field(wp_unslash($_GET['challenge_code'])) : '';
    $token = ramrod_ebay_verification_token();
    $endpoint = home_url('/ramrod/ebay/account-deletion');

    if ($_SERVER['REQUEST_METHOD'] === 'GET' && $challenge_code !== '') {
        $response_hash = hash('sha256', $challenge_code . $token . $endpoint);
        wp_send_json(array('challengeResponse' => $response_hash), 200);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $body = file_get_contents('php://input');
        update_option(RAMROD_EBAY_OPTION_LOG, array(
            'received_at' => gmdate('c'),
            'body_sha256' => hash('sha256', (string) $body),
        ), false);

        status_header(204);
        exit;
    }

    wp_send_json(array(
        'status' => 'ready',
        'endpoint' => $endpoint,
        'message' => 'RAMROD eBay marketplace account deletion endpoint is ready.'
    ), 200);
}

function ramrod_ebay_verification_token()
{
    $token = get_option(RAMROD_EBAY_OPTION_TOKEN, '');

    if (!is_string($token) || strlen($token) < 32) {
        $token = wp_generate_password(48, false, false);
        update_option(RAMROD_EBAY_OPTION_TOKEN, $token, false);
    }

    return $token;
}

function ramrod_ebay_simple_page($title, $message)
{
    status_header(200);
    nocache_headers();
    echo '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">';
    echo '<title>' . esc_html($title) . '</title>';
    echo '<style>body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:4rem;max-width:760px;line-height:1.5;color:#17213a}</style>';
    echo '</head><body><h1>' . esc_html($title) . '</h1><p>' . esc_html($message) . '</p></body></html>';
}

function ramrod_ebay_admin_menu()
{
    add_options_page('RAMROD eBay', 'RAMROD eBay', 'manage_options', 'ramrod-ebay', 'ramrod_ebay_settings_page');
}

function ramrod_ebay_register_settings()
{
    register_setting('ramrod_ebay_settings', RAMROD_EBAY_OPTION_TOKEN, array(
        'type' => 'string',
        'sanitize_callback' => 'ramrod_ebay_sanitize_token',
        'default' => ''
    ));
}

function ramrod_ebay_sanitize_token($value)
{
    $value = preg_replace('/[^A-Za-z0-9_-]/', '', (string) $value);
    return substr($value, 0, 80);
}

function ramrod_ebay_settings_page()
{
    if (!current_user_can('manage_options')) {
        return;
    }

    $endpoint = home_url('/ramrod/ebay/account-deletion');
    $token = ramrod_ebay_verification_token();
    $last = get_option(RAMROD_EBAY_OPTION_LOG, array());
    ?>
    <div class="wrap">
        <h1>RAMROD eBay Compliance</h1>
        <p>Use these values in the eBay Developer Portal for marketplace account deletion notifications.</p>
        <table class="widefat striped" style="max-width: 900px;">
            <tbody>
                <tr>
                    <th scope="row">Endpoint URL</th>
                    <td><code><?php echo esc_html($endpoint); ?></code></td>
                </tr>
                <tr>
                    <th scope="row">Verification Token</th>
                    <td><code><?php echo esc_html($token); ?></code></td>
                </tr>
                <tr>
                    <th scope="row">OAuth Accepted URL</th>
                    <td><code><?php echo esc_html(home_url('/ramrod/oauth/callback')); ?></code></td>
                </tr>
                <tr>
                    <th scope="row">OAuth Declined URL</th>
                    <td><code><?php echo esc_html(home_url('/ramrod/oauth/declined')); ?></code></td>
                </tr>
                <tr>
                    <th scope="row">Last deletion notification</th>
                    <td><code><?php echo esc_html(!empty($last['received_at']) ? $last['received_at'] : 'none'); ?></code></td>
                </tr>
            </tbody>
        </table>
        <form method="post" action="options.php" style="margin-top: 24px; max-width: 900px;">
            <?php settings_fields('ramrod_ebay_settings'); ?>
            <h2>Change Verification Token</h2>
            <p>Allowed characters: letters, numbers, underscore and hyphen. Length: 32 to 80 characters.</p>
            <input type="text" name="<?php echo esc_attr(RAMROD_EBAY_OPTION_TOKEN); ?>" value="<?php echo esc_attr($token); ?>" class="regular-text" minlength="32" maxlength="80" pattern="[A-Za-z0-9_-]{32,80}" />
            <?php submit_button('Save token'); ?>
        </form>
    </div>
    <?php
}
