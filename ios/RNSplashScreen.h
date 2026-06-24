#import <React/RCTBridgeModule.h>
#import <UIKit/UIKit.h>

@interface RNSplashScreen : NSObject<RCTBridgeModule>
+ (void)showSplash:(NSString*)splashScreen inRootView:(UIView*)rootView;
+ (void)show;
+ (void)hide;
+ (void)hideWithAnimation:(NSString*)animation duration:(double)duration;
+ (void)hideWithAnimation:(NSString*)animation duration:(double)duration scale:(double)scale;
@end
